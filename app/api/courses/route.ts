import { NextRequest, NextResponse } from "next/server";
import { query, transaction, queryOne, SqlParams } from "@/lib/mysql-direct";
import { redisCache } from "@/lib/redis-cache";
import { addCacheHeaders } from "@/lib/cache-headers";
import { Course, CourseWithRelations, ApiResponse, CourseCategory, CourseCourseType } from "@/lib/types";
import { getSession } from "@/lib/auth"; // Use getSession to check if user is logged in

// Define interface for POST body
interface CreateCourseBody {
  courseCode?: string;
  title: string;
  titleEn: string;
  description: string;
  categoryIds: string[];
  institutionId: string;
  instructorId: string;
  instructorIds?: string[];
  imageId: string;
  level: string;
  learningOutcomes?: string;
  targetAudience?: string;
  prerequisites?: string;
  tags?: string;
  assessmentCriteria?: string;
  courseUrl?: string;
  videoUrl?: string;
  contentStructure?: string;
  bannerImageId?: string;
  teachingLanguage?: string;
  durationHours?: number;
  developmentYear?: number;
  hasCertificate?: boolean;
  enrollCount?: number;
  isPopular?: boolean;
  courseTypeIds?: string[];
}

// Helper interface for relation queries
interface RelationResult {
  courseId: string;
  categoryId?: string;
  courseTypeId?: string;
  instructorId?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let categoryId = searchParams.get("categoryId");
    let institutionId = searchParams.get("institutionId");
    let level = searchParams.get("level");
    let limit = searchParams.get("limit");
    let sort = searchParams.get("sort"); // 'newest', 'popular', or null
    let isPopular = searchParams.get("isPopular");
    let refresh = searchParams.get("refresh");

    // === AUTH & RBAC ===
    const session = await getSession();
    const user = session;

    if (user && user.role === 'institution_admin' && user.institutionId) {
      // Enforce Institution ID Filter for Institution Admins
      if (institutionId && institutionId !== user.institutionId) {
        // Requesting valid data for another institution -> Deny/Empty
        return NextResponse.json({ success: true, data: [] });
      }
      institutionId = user.institutionId;
    }
    // ===================

    // Create cache key
    const cacheKey = `courses:${categoryId || 'all'}:${institutionId || 'all'}:${level || 'all'}:${isPopular || 'all'}:${limit || 'all'}:${sort || 'default'}`;

    // Check cache first (skip if refresh=true)
    if (refresh !== 'true') {
      const cachedData = await redisCache.get<ApiResponse<CourseWithRelations[]>>(cacheKey);
      if (cachedData) {
        console.log(`[API] Serving from cache: ${cacheKey}`);
        const response = NextResponse.json(cachedData);
        addCacheHeaders(response.headers, 'MEDIUM'); // 5 minutes cache
        return response;
      }
    } else {
      console.log(`[API] Cache skipped (refresh=true)`);
    }

    // Build WHERE clause
    const whereConditions: string[] = [];
    const params: SqlParams = [];

    if (categoryId) {
      whereConditions.push('c.id IN (SELECT courseId FROM course_categories WHERE categoryId = ?)');
      params.push(categoryId);
    }
    if (institutionId) {
      whereConditions.push('c.institutionId = ?');
      params.push(institutionId);
    }
    if (level) {
      whereConditions.push('c.level = ?');
      params.push(level);
    }
    if (isPopular === 'true') {
      whereConditions.push('c.isPopular = ?');
      params.push(true);
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Build ORDER BY clause based on sort parameter
    let orderByClause = 'ORDER BY c.createdAt DESC';
    if (sort === 'popular') {
      orderByClause = 'ORDER BY c.isPopular DESC, c.enrollCount DESC, c.createdAt DESC';
    } else if (sort === 'newest') {
      orderByClause = 'ORDER BY c.createdAt DESC';
    }

    // Build LIMIT clause
    const limitClause = limit ? `LIMIT ${parseInt(limit)}` : '';

    // Fetch courses - OPTIMIZED: Single query with limit
    const courses = await query<Course>(
      `SELECT * FROM courses c ${whereClause} ${orderByClause} ${limitClause}`,
      params
    );

    if (courses.length === 0) {
      const response: ApiResponse<CourseWithRelations[]> = {
        success: true,
        data: [],
      };
      await redisCache.set(cacheKey, response, { ttl: 5 * 60 }); // 5 minutes
      return NextResponse.json(response);
    }

    // Get all course IDs
    const courseIds = courses.map(c => c.id);
    const placeholders = courseIds.map(() => '?').join(',');

    // OPTIMIZED: Fetch all relations in 3 queries instead of N queries
    const [allCategories, allCourseTypes, allInstructors] = await Promise.all([
      query<RelationResult>(
        `SELECT courseId, categoryId FROM course_categories WHERE courseId IN (${placeholders})`,
        courseIds
      ),
      query<RelationResult>(
        `SELECT courseId, courseTypeId FROM course_course_types WHERE courseId IN (${placeholders})`,
        courseIds
      ),
      query<RelationResult>(
        `SELECT courseId, instructorId FROM course_instructors WHERE courseId IN (${placeholders})`,
        courseIds
      ),
    ]);

    // Group relations by courseId
    const categoriesMap = new Map<string, CourseCategory[]>();
    const courseTypesMap = new Map<string, CourseCourseType[]>();

    allCategories.forEach(item => {
      if (!item.categoryId) return;
      if (!categoriesMap.has(item.courseId)) {
        categoriesMap.set(item.courseId, []);
      }
      categoriesMap.get(item.courseId)!.push({ courseId: item.courseId, categoryId: item.categoryId });
    });

    allCourseTypes.forEach(item => {
      if (!item.courseTypeId) return;
      if (!courseTypesMap.has(item.courseId)) {
        courseTypesMap.set(item.courseId, []);
      }
      courseTypesMap.get(item.courseId)!.push({ courseId: item.courseId, courseTypeId: item.courseTypeId });
    });

    // Attach relations to courses
    const coursesWithRelations: CourseWithRelations[] = courses.map(course => {
      const categories = categoriesMap.get(course.id) || [];
      const types = courseTypesMap.get(course.id) || [];

      return {
        ...course,
        courseCategories: categories,
        courseCourseTypes: types,
        // Backward compatibility
        course_categories: categories,
        course_course_types: types,
      };
    });

    const response: ApiResponse<CourseWithRelations[]> = {
      success: true,
      data: coursesWithRelations,
    };

    // Cache the response
    await redisCache.set(cacheKey, response, { ttl: 5 * 60 }); // 5 minutes

    const jsonResponse = NextResponse.json(response);
    addCacheHeaders(jsonResponse.headers, 'MEDIUM'); // 5 minutes cache
    return jsonResponse;
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch courses",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // === AUTH & RBAC ===
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = session;
    // ===================

    const body = await request.json() as CreateCourseBody;
    console.log('[API Courses] POST Body:', JSON.stringify(body, null, 2));

    if (!body.title || !body.titleEn || !body.description || !body.categoryIds ||
      !body.institutionId || !body.instructorId || !body.imageId || !body.level) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, titleEn, description, categoryIds, institutionId, instructorId, imageId, level",
        },
        { status: 400 }
      );
    }
    console.log('[API Courses] Validated required fields');

    // RBAC: Enforce Institution ID logic
    if (user.role === 'institution_admin' && user.institutionId) {
      if (body.institutionId !== user.institutionId) {
        return NextResponse.json(
          { success: false, error: "You cannot create courses for other institutions." },
          { status: 403 }
        );
      }
    }

    if (!Array.isArray(body.categoryIds) || body.categoryIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "categoryIds must be a non-empty array",
        },
        { status: 400 }
      );
    }

    const courseId = `course-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date();

    await transaction(async (execute) => {
      // Insert course
      await execute(
        `INSERT INTO courses (
          id, courseCode, title, titleEn, description, learningOutcomes, targetAudience,
          prerequisites, tags, assessmentCriteria, courseUrl, videoUrl,
          contentStructure, institutionId, instructorId, imageId, bannerImageId,
          level, teachingLanguage, durationHours, hasCertificate, enrollCount,
          isPopular, developmentYear, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          courseId,
          body.courseCode || null,
          body.title,
          body.titleEn,
          body.description,
          body.learningOutcomes || null,
          body.targetAudience || null,
          body.prerequisites || null,
          body.tags || null,
          body.assessmentCriteria || null,
          body.courseUrl || null,
          body.videoUrl || null,
          body.contentStructure || null,
          body.institutionId,
          body.instructorId,
          body.imageId,
          body.bannerImageId || null,
          body.level,
          body.teachingLanguage || null,
          body.durationHours || 0,
          body.hasCertificate || false,
          body.enrollCount || 0,
          body.isPopular || false,
          body.developmentYear || new Date().getFullYear(),
          now,
          now
        ]
      );

      // Insert course categories
      for (const categoryId of body.categoryIds) {
        await execute(
          'INSERT INTO course_categories (courseId, categoryId) VALUES (?, ?)',
          [courseId, categoryId]
        );
      }

      // Insert course types if provided
      if (body.courseTypeIds && Array.isArray(body.courseTypeIds) && body.courseTypeIds.length > 0) {
        for (const courseTypeId of body.courseTypeIds) {
          await execute(
            'INSERT INTO course_course_types (courseId, courseTypeId) VALUES (?, ?)',
            [courseId, courseTypeId]
          );
        }
      }

      // Insert course instructors
      if (body.instructorIds && Array.isArray(body.instructorIds) && body.instructorIds.length > 0) {
        for (const instructorId of body.instructorIds) {
          await execute(
            'INSERT INTO course_instructors (courseId, instructorId) VALUES (?, ?)',
            [courseId, instructorId]
          );
        }
      } else if (body.instructorId) {
        await execute(
          'INSERT INTO course_instructors (courseId, instructorId) VALUES (?, ?)',
          [courseId, body.instructorId]
        );
      }
    });
    console.log(`[API Courses] Transaction complete. Course created with ID: ${courseId}`);

    // Clear cache when new course is added
    redisCache.clearPattern('courses:*');

    const newCourse = await queryOne<Course>(
      'SELECT * FROM courses WHERE id = ?',
      [courseId]
    );

    const response: ApiResponse<Course> = {
      success: true,
      data: newCourse || undefined,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[API Courses] Fatal Error in POST:', error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create course",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
