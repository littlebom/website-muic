import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/mysql-direct";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const active = searchParams.get("active");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    let whereClause = "1=1";
    const params: any[] = [];

    if (category) {
      whereClause += " AND category = ?";
      params.push(category);
    }

    if (active === "true") {
      whereClause += " AND is_active = TRUE";
    }

    if (search) {
      whereClause += " AND (title LIKE ? OR content LIKE ? OR keywords LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const sqlQuery = `SELECT id, title, content, category, keywords, is_active, view_count, created_by, created_at, updated_at FROM guides WHERE ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const guides = await query(sqlQuery, params);

    const countResult = await query(`SELECT COUNT(*) as total FROM guides WHERE ${whereClause}`, params);
    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: guides,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    console.error("[API Guides] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, keywords } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: "Title and content are required" }, { status: 400 });
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const id = `guide-${timestamp}-${random}`;

    await execute(
      `INSERT INTO guides (id, title, content, category, keywords, is_active, view_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, TRUE, 0, NOW(), NOW())`,
      [id, title, content, category || null, keywords || null]
    );

    const guides = await query("SELECT * FROM guides WHERE id = ?", [id]);
    return NextResponse.json({ success: true, data: guides[0] });
  } catch (error) {
    console.error("[API Guides] Error creating guide:", error);
    return NextResponse.json({ success: false, error: "Failed to create guide" }, { status: 500 });
  }
}
