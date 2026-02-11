import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { query, execute } from "@/lib/mysql-direct";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("active");

    let sql = 'SELECT * FROM popups';
    const params: any[] = [];

    if (activeOnly === "true") {
      sql += ' WHERE isActive = ?';
      params.push(true);
    }

    sql += ' ORDER BY displayOrder ASC, createdAt DESC';

    const popups = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: popups,
      count: popups.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch popups",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || !body.titleEn || !body.imageId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, titleEn, imageId",
        },
        { status: 400 }
      );
    }

    // Generate unique popup ID
    const popupId = `popup-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date();

    await execute(
      `INSERT INTO popups (
        id, title, titleEn, description, descriptionEn,
        imageId, linkUrl, buttonText, buttonTextEn,
        isActive, startDate, endDate, displayOrder, showOnce,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        popupId,
        body.title,
        body.titleEn,
        body.description || null,
        body.descriptionEn || null,
        body.imageId,
        body.linkUrl || null,
        body.buttonText || null,
        body.buttonTextEn || null,
        body.isActive ?? true,
        body.startDate ? new Date(body.startDate) : null,
        body.endDate ? new Date(body.endDate) : null,
        body.displayOrder ?? 0,
        body.showOnce ?? false,
        now,
        now
      ]
    );

    const newPopup = await query(
      'SELECT * FROM popups WHERE id = ?',
      [popupId]
    );

    // Revalidate the cache for popup pages
    revalidatePath("/admin/popups");
    revalidatePath("/");

    return NextResponse.json(
      {
        success: true,
        data: newPopup[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating popup:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create popup",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
