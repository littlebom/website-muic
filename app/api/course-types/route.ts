import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/mysql-direct";
import { redisCache } from "@/lib/redis-cache";
import { addCacheHeaders } from "@/lib/cache-headers";
import { CourseType, ApiResponse } from "@/lib/types";

const CACHE_KEY = 'course-types:all';

interface CreateCourseTypeBody {
  name: string;
  nameEn: string;
  icon?: string;
  description?: string;
}

export async function GET() {
  try {
    // Check cache first
    const cachedData = await redisCache.get<ApiResponse<CourseType[]>>(CACHE_KEY);
    if (cachedData) {
      const response = NextResponse.json(cachedData);
      addCacheHeaders(response.headers, 'LONG'); // 15 minutes cache
      return response;
    }

    const courseTypes = await query<CourseType>(
      'SELECT * FROM course_types ORDER BY createdAt DESC'
    );

    const responseData: ApiResponse<CourseType[]> = {
      success: true,
      data: courseTypes,
    };

    // Cache for 15 minutes (course types don't change often)
    await redisCache.set(CACHE_KEY, responseData, { ttl: 15 * 60 });

    const response = NextResponse.json(responseData);
    addCacheHeaders(response.headers, 'LONG'); // 15 minutes cache
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch course types",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateCourseTypeBody;

    if (!body.name || !body.nameEn) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, nameEn",
        },
        { status: 400 }
      );
    }

    const id = `ctype-${Date.now()}`;
    const now = new Date();

    await execute(
      `INSERT INTO course_types (id, name, nameEn, icon, description, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, body.name, body.nameEn, body.icon || null, body.description || null, now, now]
    );

    const newCourseType = await query<CourseType>(
      'SELECT * FROM course_types WHERE id = ?',
      [id]
    );

    // Clear cache when new course type is added
    await redisCache.delete(CACHE_KEY);

    const response: ApiResponse<CourseType> = {
      success: true,
      data: newCourseType[0],
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating course type:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create course type",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
