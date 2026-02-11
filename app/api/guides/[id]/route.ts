import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/mysql-direct";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const guides = await query(`SELECT * FROM guides WHERE id = ?`, [id]);
    if (guides.length === 0) {
      return NextResponse.json({ success: false, error: "Guide not found" }, { status: 404 });
    }
    await execute(`UPDATE guides SET view_count = view_count + 1 WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, data: guides[0] });
  } catch (error) {
    console.error("[API Guides] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates: string[] = [];
    const values: any[] = [];
    if (body.title !== undefined) { updates.push("title = ?"); values.push(body.title); }
    if (body.content !== undefined) { updates.push("content = ?"); values.push(body.content); }
    if (body.category !== undefined) { updates.push("category = ?"); values.push(body.category); }
    if (body.keywords !== undefined) { updates.push("keywords = ?"); values.push(body.keywords); }
    if (body.is_active !== undefined) { updates.push("is_active = ?"); values.push(body.is_active); }
    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }
    updates.push("updated_at = NOW()");
    values.push(id);
    const sql = `UPDATE guides SET ${updates.join(", ")} WHERE id = ?`;
    await execute(sql, values);
    const updated = await query("SELECT * FROM guides WHERE id = ?", [id]);
    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error("[API Guides] Error updating guide:", error);
    return NextResponse.json({ success: false, error: "Failed to update guide" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await execute("DELETE FROM guides WHERE id = ?", [id]);
    return NextResponse.json({ success: true, message: "Guide deleted successfully" });
  } catch (error) {
    console.error("[API Guides] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete guide" }, { status: 500 });
  }
}