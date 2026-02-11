import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/mysql-direct";
import { redisCache } from "@/lib/redis-cache";
import { addCacheHeaders } from "@/lib/cache-headers";
import { Category, ApiResponse } from "@/lib/types";

const CACHE_KEY = 'categories:all';

interface CreateCategoryBody {
  name: string;
  nameEn: string;
  icon: string;
}

export async function GET() {
  try {
    // Check cache first
    const cachedData = await redisCache.get<ApiResponse<Category[]>>(CACHE_KEY);
    if (cachedData) {
      const response = NextResponse.json(cachedData);
      addCacheHeaders(response.headers, 'LONG'); // 15 minutes - categories rarely change
      return response;
    }

    const categories = await query<Category>(
      'SELECT * FROM categories ORDER BY createdAt DESC'
    );

    const response: ApiResponse<Category[]> = {
      success: true,
      data: categories,
    };

    // Cache for 15 minutes (categories don't change often)
    await redisCache.set(CACHE_KEY, response, { ttl: 15 * 60 });

    const jsonResponse = NextResponse.json(response);
    addCacheHeaders(jsonResponse.headers, 'LONG'); // 15 minutes cache
    return jsonResponse;
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateCategoryBody;

    if (!body.name || !body.nameEn || !body.icon) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, nameEn, icon",
        },
        { status: 400 }
      );
    }

    // Generate ID: 2-digit format (01, 02, 03, ...)
    const lastCategory = await queryOne<{ id: string }>(
      'SELECT id FROM categories ORDER BY id DESC LIMIT 1'
    );

    let sequence = 1;
    if (lastCategory && lastCategory.id.match(/^\d{2}$/)) {
      sequence = parseInt(lastCategory.id) + 1;
    }

    const id = sequence.toString().padStart(2, '0');
    const now = new Date();

    await execute(
      'INSERT INTO categories (id, name, nameEn, icon, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, body.name, body.nameEn, body.icon, now, now]
    );

    const newCategory = await queryOne<Category>(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    // Clear cache when new category is added
    await redisCache.delete(CACHE_KEY);

    const response: ApiResponse<Category> = {
      success: true,
      data: newCategory || undefined,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create category",
      },
      { status: 500 }
    );
  }
}
