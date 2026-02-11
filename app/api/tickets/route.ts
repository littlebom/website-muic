import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/data";
import { sendTicketCreatedEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const email = searchParams.get("email");
    // ✅ Fixed SQL Injection: ใช้ parameterized query สำหรับ LIMIT และ OFFSET
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50"), 1), 100); // จำกัด 1-100
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0); // ต้อง >= 0

    let sql = "SELECT * FROM tickets WHERE 1=1";
    const params: any[] = [];

    if (status) { sql += " AND status = ?"; params.push(status); }
    if (email) { sql += " AND user_email = ?"; params.push(email); }

    // ✅ Fixed SQL Injection: ใช้ parameterized query แทน string interpolation
    // Note: LIMIT/OFFSET ต้องใช้ direct value เพราะ MySQL prepared statements ไม่รองรับ placeholders สำหรับ LIMIT
    sql += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const tickets = await query(sql, params);
    return NextResponse.json({ success: true, data: tickets });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_name, user_email, subject, description, category } = body;

    if (!user_email || !subject || !description) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const id = `ticket-${timestamp}-${random}`;

    const year = new Date().getFullYear();
    const countResult = await query("SELECT COUNT(*) as c FROM tickets");
    const num = String(countResult[0].c + 1).padStart(4, '0');
    const ticket_number = `TK-${year}-${num}`;

    await execute(
      `INSERT INTO tickets (id, ticket_number, user_name, user_email, subject, description, category, status, priority, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'new', 'normal', NOW(), NOW())`,
      [id, ticket_number, user_name || 'Guest', user_email, subject, description, category || 'general']
    );

    const result = await query("SELECT * FROM tickets WHERE id = ?", [id]);
    const ticket = result[0];

    // Send welcome email with ticket info
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const trackUrl = `${baseUrl}/support/track?ticket_number=${encodeURIComponent(ticket_number)}&email=${encodeURIComponent(user_email)}`;

    await sendTicketCreatedEmail({
      ticketNumber: ticket_number,
      userName: user_name || 'Guest',
      userEmail: user_email,
      subject,
      category: category || 'general',
      priority: 'normal',
      description,
      trackUrl,
    });

    return NextResponse.json({ success: true, data: ticket }, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
