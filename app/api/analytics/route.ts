import { NextResponse } from "next/server";
import { query } from "@/lib/data";
import { redisCache } from "@/lib/redis-cache";
import { addCacheHeaders } from "@/lib/cache-headers";
import { requireAuth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Get Session for User Context
    // We use requireAuth to ensure the user is logged in
    // and to get their role and institutionId
    let user;
    try {
      user = await requireAuth();
    } catch (e) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const institutionId = user.institutionId;
    const isInstitutionAdmin = user.role === 'institution_admin' && institutionId;

    // Cache key includes institutionId to separate caches per institution
    const CACHE_KEY = `analytics:dashboard:${institutionId || 'global'}`;
    const CACHE_TTL = 2 * 60; // 2 minutes

    // ✅ Check cache
    const cachedData = await redisCache.get(CACHE_KEY);
    if (cachedData) {
      const response = NextResponse.json(cachedData);
      addCacheHeaders(response.headers, 'SHORT');
      return response;
    }

    // Helper function to safely query tables
    const safeQuery = async (sql: string, params: any[] = [], defaultValue: any[] = [{ count: 0 }]) => {
      try {
        return await query(sql, params);
      } catch (error: any) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
          return defaultValue;
        }
        throw error;
      }
    };

    // Construct WHERE clauses
    const instFilter = isInstitutionAdmin ? 'WHERE institutionId = ?' : '';
    const instParams = isInstitutionAdmin ? [institutionId] : [];

    const institutionsFilter = isInstitutionAdmin ? 'WHERE id = ?' : '';

    // Parallel Queries
    const [
      coursesCount,
      categoriesCount,
      instructorsCount,
      institutionsCount,
      newsCount,
      bannersCount,
      guidesCount,
      ticketsCount,
      conversationsCount,
      popupsCount,
      adminUsersCount,
      courseTypesCount,
    ] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM courses ${instFilter}`, instParams),
      query("SELECT COUNT(*) as count FROM categories"), // Shared
      query(`SELECT COUNT(*) as count FROM instructors ${instFilter}`, instParams),
      query(`SELECT COUNT(*) as count FROM institutions ${institutionsFilter}`, instParams),
      query(`SELECT COUNT(*) as count FROM news ${instFilter}`, instParams),
      query(`SELECT COUNT(*) as count FROM banners ${instFilter}`, instParams),
      safeQuery("SELECT COUNT(*) as count FROM guides"), // Shared
      safeQuery("SELECT COUNT(*) as count FROM tickets"), // Shared for now
      safeQuery("SELECT COUNT(*) as count FROM chat_conversations"), // Shared for now
      query("SELECT COUNT(*) as count FROM popups"), // Shared
      query("SELECT COUNT(*) as count FROM admin_users"), // Shared
      query("SELECT COUNT(*) as count FROM course_types"), // Shared
    ]);

    // Ticket Stats (Global for now)
    const ticketStats = await safeQuery(`
      SELECT status, COUNT(*) as count FROM tickets GROUP BY status
    `, []);

    const unreadTickets = await safeQuery(`
      SELECT COUNT(*) as count FROM tickets WHERE is_read = FALSE OR is_read IS NULL
    `);

    const ticketPriority = await safeQuery(`
      SELECT priority, COUNT(*) as count FROM tickets GROUP BY priority
    `, []);

    const recentTickets = await safeQuery(`
      SELECT COUNT(*) as count FROM tickets WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    // Chat Stats (Global)
    const chatStats = await safeQuery(`
      SELECT status, COUNT(*) as count FROM chat_conversations GROUP BY status
    `, []);

    const unreadConversations = await safeQuery(`
      SELECT COUNT(*) as count FROM chat_conversations WHERE is_read = FALSE OR is_read IS NULL
    `);

    // Active Guides (Global)
    const activeGuides = await safeQuery(`
      SELECT COUNT(*) as count FROM guides WHERE is_active = true
    `);

    // Popups (Global)
    const activePopups = await query(`
      SELECT COUNT(*) as count FROM popups WHERE isActive = true
    `);

    // Top Guides (Global)
    const topGuides = await safeQuery(`
      SELECT id, title, view_count FROM guides WHERE is_active = true ORDER BY view_count DESC LIMIT 5
    `);

    // Recent News (Filtered)
    const recentNews = await query(`
      SELECT COUNT(*) as count FROM news WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) ${isInstitutionAdmin ? 'AND institutionId = ?' : ''}
    `, instParams);

    // Courses By Category (Filtered)
    let coursesByCategorySql = `
      SELECT
        c.name as category,
        COUNT(cc.courseId) as count
      FROM categories c
      LEFT JOIN course_categories cc ON c.id = cc.categoryId
    `;

    if (isInstitutionAdmin) {
      coursesByCategorySql += `
        LEFT JOIN courses co ON cc.courseId = co.id
        WHERE co.institutionId = ?
       `;
    }

    coursesByCategorySql += `
      GROUP BY c.id, c.name
      ORDER BY count DESC
      LIMIT 10
    `;

    const coursesByCategory = await query(coursesByCategorySql, instParams);

    const responseData = {
      success: true,
      data: {
        overview: {
          courses: coursesCount[0].count,
          categories: categoriesCount[0].count,
          instructors: instructorsCount[0].count,
          institutions: institutionsCount[0].count,
          news: newsCount[0].count,
          banners: bannersCount[0].count,
          guides: guidesCount[0].count,
          activeGuides: activeGuides[0].count,
          tickets: ticketsCount[0].count,
          conversations: conversationsCount[0].count,
          popups: popupsCount[0].count,
          activePopups: activePopups[0].count,
          adminUsers: adminUsersCount[0].count,
          courseTypes: courseTypesCount[0].count,
        },
        tickets: {
          total: ticketsCount[0].count,
          unread: unreadTickets[0].count,
          byStatus: ticketStats.reduce((acc: any, item: any) => {
            acc[item.status] = item.count;
            return acc;
          }, {}),
          byPriority: ticketPriority.reduce((acc: any, item: any) => {
            acc[item.priority] = item.count;
            return acc;
          }, {}),
          recentWeek: recentTickets[0].count,
        },
        chat: {
          total: conversationsCount[0].count,
          unread: unreadConversations[0].count,
          byStatus: chatStats.reduce((acc: any, item: any) => {
            acc[item.status] = item.count;
            return acc;
          }, {}),
        },
        guides: {
          total: guidesCount[0].count,
          active: activeGuides[0].count,
          topViewed: topGuides,
        },
        news: {
          total: newsCount[0].count,
          recentMonth: recentNews[0].count,
        },
        courses: {
          total: coursesCount[0].count,
          byCategory: coursesByCategory,
        },
      },
    };

    await redisCache.set(CACHE_KEY, responseData, { ttl: CACHE_TTL });

    const response = NextResponse.json(responseData);
    addCacheHeaders(response.headers, 'SHORT');
    return response;
  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
