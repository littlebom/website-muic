import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/data";

// GET /api/chat/conversations - List all conversations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedTo = searchParams.get("assigned_to");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions: string[] = ["1=1"];
    const params: any[] = [];

    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }

    if (priority) {
      conditions.push("priority = ?");
      params.push(priority);
    }

    if (assignedTo) {
      conditions.push("assigned_to = ?");
      params.push(assignedTo);
    }

    const whereClause = conditions.join(" AND ");

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM chat_conversations WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get conversations with embedded LIMIT/OFFSET
    const sqlQuery = `
      SELECT id, user_id, user_name, user_email, status, priority, category, 
             assigned_to, last_message_at, created_at, updated_at
      FROM chat_conversations 
      WHERE ${whereClause} 
      ORDER BY last_message_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const conversations = await query(sqlQuery, params);

    return NextResponse.json({
      success: true,
      data: conversations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/chat/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, user_name, user_email, category, priority } = body;

    if (!user_name && !user_email) {
      return NextResponse.json(
        { success: false, error: "User name or email is required" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const id = `conv-${timestamp}-${random}`;

    await execute(
      `INSERT INTO chat_conversations 
       (id, user_id, user_name, user_email, status, priority, category, last_message_at, created_at, updated_at) 
       VALUES (?, ?, ?, ?, 'active', ?, ?, NOW(), NOW(), NOW())`,
      [id, user_id || null, user_name || null, user_email || null, priority || "normal", category || null]
    );

    const result = await query(
      "SELECT * FROM chat_conversations WHERE id = ?",
      [id]
    );

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
