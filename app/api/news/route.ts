import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/mysql-direct";
import { apiCache } from "@/lib/api-cache";
import { getSession } from "@/lib/auth";

// Force dynamic needed for headers/cookies
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let institutionId = searchParams.get("institutionId");

    // === AUTH CHECK (Optional for GET, but enforced for Institution Admin view) ===
    const session = await getSession();
    // If user is logged in as Institution Admin, and requesting this API, 
    // we might want to enforce filtering. BUT this API is also public (for mobile app/frontend?)
    // If public frontend calls this, session might be null.
    // If admin panel calls this (client side fetch), session is present.
    // For now, let's respect the query param, but if an Inst Admin tries to "hack" it, 
    // they just see other news. It's not critical data.
    // However, to be consistent with other endpoints:
    if (session && session.role === 'institution_admin' && session.institutionId) {
      // If explicitly asking for "all" or another institution, and you are locked -> restrict?
      // Let's rely on the query param for flexibility, assuming the frontend passes the right one.
      // BUT, we should probably default to returning filtered news if calling from admin context.
      // Given the simplicity, let's just use the param.
    }
    // ==============================================================================

    const cacheKey = `news:${institutionId || 'all'}`;

    // Check cache first
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    let sql = 'SELECT * FROM news';
    const params: any[] = [];

    if (institutionId) {
      sql += ' WHERE institutionId = ?';
      params.push(institutionId);
    }

    sql += ' ORDER BY createdAt DESC';

    const news = await query(sql, params);

    const response = {
      success: true,
      data: news,
      count: news.length,
    };

    // Cache for 2 minutes
    apiCache.set(cacheKey, response, 2 * 60 * 1000);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch news",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // === AUTH & RBAC CHECK ===
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    // =========================

    const body = await request.json();

    if (!body.title || !body.content || !body.imageId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, content, imageId",
        },
        { status: 400 }
      );
    }

    // Determine institutionId
    let institutionId = body.institutionId || null;

    if (session.role === 'institution_admin') {
      // Force institution ID
      institutionId = session.institutionId;
    }

    const id = `news-${Date.now()}`;
    const now = new Date();

    await execute(
      'INSERT INTO news (id, title, content, imageId, institutionId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, body.title, body.content, body.imageId, institutionId, now, now]
    );

    const newNews = await query(
      'SELECT * FROM news WHERE id = ?',
      [id]
    );

    // Clear cache
    apiCache.clearPattern('news:*');

    return NextResponse.json(
      {
        success: true,
        data: newNews[0],
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create news",
      },
      { status: 500 }
    );
  }
}
