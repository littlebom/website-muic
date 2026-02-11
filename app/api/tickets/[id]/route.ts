import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/data";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tickets = await query("SELECT * FROM tickets WHERE id = ?", [id]);
    if (tickets.length === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const replies = await query("SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC", [id]);
    return NextResponse.json({ success: true, data: { ...tickets[0], replies } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates: string[] = [];
    const values: any[] = [];

    if (body.status) { updates.push("status = ?"); values.push(body.status); }
    if (body.priority) { updates.push("priority = ?"); values.push(body.priority); }
    if (body.assigned_to !== undefined) { updates.push("assigned_to = ?"); values.push(body.assigned_to); }
    if (body.is_read !== undefined) { updates.push("is_read = ?"); values.push(body.is_read); }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    await execute(`UPDATE tickets SET ${updates.join(", ")} WHERE id = ?`, values);
    const result = await query("SELECT * FROM tickets WHERE id = ?", [id]);
    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await execute("DELETE FROM tickets WHERE id = ?", [id]);
    return NextResponse.json({ success: true, message: "Ticket deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
