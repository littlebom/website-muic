import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/mysql-direct";
import { apiCache } from "@/lib/api-cache";
import { getSession } from "@/lib/auth";

// Force dynamic needed because we use headers/cookies
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let institutionId = searchParams.get("institutionId");

    // === AUTH & RBAC ===
    const session = await getSession();
    if (session && session.role === 'institution_admin' && session.institutionId) {
      if (institutionId && institutionId !== session.institutionId) {
        return NextResponse.json({ success: true, data: [], count: 0 });
      }
      institutionId = session.institutionId;
    }
    // ===================

    // Cache key based on filter
    const cacheKey = `instructors:${institutionId || 'all'}`;

    // Check cache first
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    let sql = 'SELECT * FROM instructors';
    const params: any[] = [];

    if (institutionId) {
      sql += ' WHERE institutionId = ?';
      params.push(institutionId);
    }

    sql += ' ORDER BY createdAt DESC';

    const instructors = await query(sql, params);

    const response = {
      success: true,
      data: instructors,
      count: instructors.length,
    };

    // Cache for 3 minutes
    apiCache.set(cacheKey, response, 3 * 60 * 1000);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch instructors",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.name || !body.nameEn || !body.title || !body.institutionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, nameEn, title, institutionId",
        },
        { status: 400 }
      );
    }

    // RBAC Check
    if (session.role === 'institution_admin' && session.institutionId) {
      if (body.institutionId !== session.institutionId) {
        return NextResponse.json({ success: false, error: "Unauthorized institution" }, { status: 403 });
      }
    }

    // Generate ID
    const id = `instr-${Date.now()}`;
    const now = new Date();

    await execute(
      `INSERT INTO instructors (id, name, nameEn, title, institutionId, bio, imageUrl, email, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.name,
        body.nameEn,
        body.title,
        body.institutionId,
        body.bio || null,
        body.imageUrl || null,
        body.email || null,
        now,
        now
      ]
    );

    const newInstructor = await query(
      'SELECT * FROM instructors WHERE id = ?',
      [id]
    );

    // Clear cache when new instructor is added
    apiCache.clearPattern('instructors:*');

    return NextResponse.json(
      {
        success: true,
        data: newInstructor[0],
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create instructor",
      },
      { status: 500 }
    );
  }
}
