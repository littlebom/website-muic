import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const replies = await query(
      "SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC",
      [id]
    );

    return NextResponse.json({
      success: true,
      data: replies,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch replies" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { message, sender_type } = body;

    if (!message || !sender_type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const replyId = `reply-${timestamp}-${random}`;

    await execute(
      `INSERT INTO ticket_replies (id, ticket_id, sender_type, message, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [replyId, id, sender_type, message]
    );

    // Update ticket's updated_at timestamp
    await execute(
      "UPDATE tickets SET updated_at = NOW() WHERE id = ?",
      [id]
    );

    const result = await query(
      "SELECT * FROM ticket_replies WHERE id = ?",
      [replyId]
    );

    return NextResponse.json(
      { success: true, data: result[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create reply" },
      { status: 500 }
    );
  }
}
