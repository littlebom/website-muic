import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/data";

// GET /api/chat/conversations/[id] - Get single conversation with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const conversations = await query(
      "SELECT * FROM chat_conversations WHERE id = ?",
      [id]
    );

    if (conversations.length === 0) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Get all messages for this conversation
    const messages = await query(
      "SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC",
      [id]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...conversations[0],
        messages,
      },
    });
  } catch (error: any) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/chat/conversations/[id] - Update conversation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];

    if (body.status !== undefined) {
      updates.push("status = ?");
      values.push(body.status);
    }

    if (body.priority !== undefined) {
      updates.push("priority = ?");
      values.push(body.priority);
    }

    if (body.category !== undefined) {
      updates.push("category = ?");
      values.push(body.category);
    }

    if (body.assigned_to !== undefined) {
      updates.push("assigned_to = ?");
      values.push(body.assigned_to);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    const sql = `UPDATE chat_conversations SET ${updates.join(", ")} WHERE id = ?`;
    await execute(sql, values);

    const updated = await query(
      "SELECT * FROM chat_conversations WHERE id = ?",
      [id]
    );

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error: any) {
    console.error("Error updating conversation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/conversations/[id] - Delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Messages will be deleted automatically due to CASCADE
    await execute("DELETE FROM chat_conversations WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
