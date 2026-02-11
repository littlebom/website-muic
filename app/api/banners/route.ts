import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { query, execute } from "@/lib/mysql-direct";
import { redisCache } from "@/lib/redis-cache";
import { getSession } from "@/lib/auth";

// Force dynamic needed for headers/cookies
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("active");
    const institutionId = searchParams.get("institutionId");

    // Cache key based on filter
    const cacheKey = `banners:${activeOnly === 'true' ? 'active' : 'all'}:${institutionId || 'all'}`;

    // Check cache first
    const cachedData = await redisCache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    let sql = 'SELECT * FROM banners';
    const params: any[] = [];
    const whereConditions: string[] = [];

    if (activeOnly === "true") {
      whereConditions.push('isActive = ?');
      params.push(true);
    }
    if (institutionId) {
      whereConditions.push('institutionId = ?');
      params.push(institutionId);
    }

    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }

    sql += ' ORDER BY `order` ASC';

    const banners = await query(sql, params);

    const response = {
      success: true,
      data: banners,
      count: banners.length,
    };

    // Cache for 3 minutes (banners change occasionally)
    await redisCache.set(cacheKey, response, { ttl: 180 });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch banners",
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

    if (!body.title || !body.titleEn) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, titleEn",
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

    // Generate unique banner ID
    const bannerId = `banner-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date();

    await execute(
      `INSERT INTO banners (
        id, title, titleEn, subtitle, subtitleEn, description, descriptionEn,
        buttonText, buttonTextEn, imageId, backgroundImageId, overlayImageId, linkUrl,
        backgroundColor, textColor, accentColor, isActive, \`order\`, templateId, institutionId,
        showSearchBox, overlayOpacity, linkTarget,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bannerId,
        body.title,
        body.titleEn,
        body.subtitle || null,
        body.subtitleEn || null,
        body.description || null,
        body.descriptionEn || null,
        body.buttonText || null,
        body.buttonTextEn || null,
        body.imageId || "",
        body.backgroundImageId || null,
        body.overlayImageId || null,
        body.linkUrl || null,
        body.backgroundColor || null,
        body.textColor || null,
        body.accentColor || null,
        body.isActive ?? true,
        body.order ?? 0,
        body.templateId || null,
        institutionId,
        body.showSearchBox ?? true,
        body.overlayOpacity ?? 40,
        body.linkTarget || '_self',
        now,
        now
      ]
    );

    const newBanner = await query(
      'SELECT * FROM banners WHERE id = ?',
      [bannerId]
    );

    // Clear cache when new banner is added
    await redisCache.clearPattern('banners:*');

    // Revalidate the cache for banner pages
    revalidatePath("/admin/banners");
    revalidatePath("/");

    return NextResponse.json(
      {
        success: true,
        data: newBanner[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create banner",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
