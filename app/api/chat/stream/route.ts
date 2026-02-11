import { NextRequest } from 'next/server';
import { query } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/stream?conversation_id=xxx
 * Server-Sent Events endpoint for real-time chat messages
 */
export async function GET(request: NextRequest) {
    const conversationId = request.nextUrl.searchParams.get('conversation_id');

    if (!conversationId) {
        return new Response('conversation_id is required', { status: 400 });
    }

    // Verify conversation exists
    try {
        const conversation = await query(
            'SELECT * FROM chat_conversations WHERE id = ?',
            [conversationId]
        );

        if (conversation.length === 0) {
            return new Response('Conversation not found', { status: 404 });
        }
    } catch (error) {
        console.error('[SSE] Error verifying conversation:', error);
        return new Response('Internal server error', { status: 500 });
    }

    console.log(`[SSE] Client connecting to conversation: ${conversationId}`);

    const encoder = new TextEncoder();
    let lastMessageId = '';

    const stream = new ReadableStream({
        async start(controller) {
            try {
                // 1. Send existing messages first
                const messages = await query(
                    'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC',
                    [conversationId]
                );

                if (messages.length > 0) {
                    lastMessageId = messages[messages.length - 1].id;
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: 'initial', messages })}\n\n`)
                    );
                    console.log(`[SSE] Sent ${messages.length} initial messages`);
                } else {
                    console.log('[SSE] No existing messages');
                }

                // 2. Poll for new messages every 3 seconds
                const interval = setInterval(async () => {
                    try {
                        const newMessages = await query(
                            'SELECT * FROM chat_messages WHERE conversation_id = ? AND id > ? ORDER BY created_at ASC',
                            [conversationId, lastMessageId]
                        );

                        if (newMessages.length > 0) {
                            lastMessageId = newMessages[newMessages.length - 1].id;
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ type: 'new', messages: newMessages })}\n\n`)
                            );
                            console.log(`[SSE] Sent ${newMessages.length} new messages`);
                        }
                    } catch (error) {
                        console.error('[SSE] Error polling messages:', error);
                    }
                }, 3000);

                // 3. Send heartbeat every 30 seconds (keep connection alive)
                const heartbeat = setInterval(() => {
                    controller.enqueue(encoder.encode(': heartbeat\n\n'));
                }, 30000);

                // 4. Auto-close connection after 30 minutes
                const timeout = setTimeout(() => {
                    console.log(`[SSE] Connection timeout for conversation: ${conversationId}`);
                    clearInterval(interval);
                    clearInterval(heartbeat);
                    controller.close();
                }, 30 * 60 * 1000);

                // 5. Cleanup on disconnect
                request.signal.addEventListener('abort', () => {
                    console.log(`[SSE] Client disconnected from conversation: ${conversationId}`);
                    clearInterval(interval);
                    clearInterval(heartbeat);
                    clearTimeout(timeout);
                    controller.close();
                });

            } catch (error) {
                console.error('[SSE] Error in stream start:', error);
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable nginx buffering
        },
    });
}
