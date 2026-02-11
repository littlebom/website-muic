import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticket_number = searchParams.get("ticket_number");
    const email = searchParams.get("email");

    // ต้องมีอย่างน้อย 1 ค่า
    if (!ticket_number && !email) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกหมายเลข Ticket หรืออีเมลอย่างน้อย 1 อย่าง" },
        { status: 400 }
      );
    }

    // สร้าง query แบบ dynamic
    let sqlQuery = "SELECT * FROM tickets WHERE ";
    const queryParams: string[] = [];
    const conditions: string[] = [];

    if (ticket_number) {
      conditions.push("ticket_number = ?");
      queryParams.push(ticket_number);
    }

    if (email) {
      conditions.push("user_email = ?");
      queryParams.push(email);
    }

    sqlQuery += conditions.join(" AND ");

    // ค้นหา ticket
    const tickets = await query(sqlQuery, queryParams);

    if (tickets.length === 0) {
      return NextResponse.json(
        { success: false, message: "ไม่พบ Ticket ที่ตรงกับข้อมูลที่ค้นหา" },
        { status: 404 }
      );
    }

    // ดึง replies สำหรับทุก ticket
    const ticketsWithReplies = await Promise.all(
      tickets.map(async (ticket: any) => {
        const replies = await query(
          "SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC",
          [ticket.id]
        );
        return {
          ...ticket,
          replies,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: ticketsWithReplies,
      count: ticketsWithReplies.length,
    });
  } catch (error) {
    console.error("Track Ticket Error:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการค้นหา" },
      { status: 500 }
    );
  }
}
