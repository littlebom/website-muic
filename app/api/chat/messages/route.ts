import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/data";

// GET /api/chat/messages?conversation_id=xxx - Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get("conversation_id");

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: "conversation_id is required" },
        { status: 400 }
      );
    }

    const messages = await query(
      "SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC",
      [conversationId]
    );

    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/chat/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_id, sender_type, sender_id, sender_name, message, metadata } = body;

    if (!conversation_id || !sender_type || !message) {
      return NextResponse.json(
        { success: false, error: "conversation_id, sender_type, and message are required" },
        { status: 400 }
      );
    }

    // Validate sender_type
    if (!["user", "ai", "admin"].includes(sender_type)) {
      return NextResponse.json(
        { success: false, error: "sender_type must be user, ai, or admin" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const id = `msg-${timestamp}-${random}`;

    await execute(
      `INSERT INTO chat_messages 
       (id, conversation_id, sender_type, sender_id, sender_name, message, metadata, is_read, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, NOW())`,
      [
        id,
        conversation_id,
        sender_type,
        sender_id || null,
        sender_name || null,
        message,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    // Update conversation's last_message_at
    await execute(
      "UPDATE chat_conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = ?",
      [conversation_id]
    );

    const result = await query("SELECT * FROM chat_messages WHERE id = ?", [id]);

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
