import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/mysql-direct";
import { redisCache } from "@/lib/redis-cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // ... existing GET implementation ...
    const news = await queryOne(
      'SELECT * FROM news WHERE id = ?',
      [id]
    );

    if (!news) {
      return NextResponse.json(
        {
          success: false,
          error: "News not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: news,
    });
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];

    if (body.title) {
      updates.push('title = ?');
      values.push(body.title);
    }
    if (body.content) {
      updates.push('content = ?');
      values.push(body.content);
    }
    if (body.imageId) {
      updates.push('imageId = ?');
      values.push(body.imageId);
    }

    updates.push('updatedAt = ?');
    values.push(new Date());

    values.push(id);

    const result = await execute(
      `UPDATE news SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "News not found",
        },
        { status: 404 }
      );
    }

    // Clear cache
    await redisCache.clearPattern('news:*');
    await redisCache.delete(`news:${id}`);

    const updatedNews = await queryOne(
      'SELECT * FROM news WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      data: updatedNews,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update news",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await execute('DELETE FROM news WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "News not found",
        },
        { status: 404 }
      );
    }

    // Clear cache
    await redisCache.clearPattern('news:*');
    await redisCache.delete(`news:${id}`);

    return NextResponse.json({
      success: true,
      message: "News deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete news",
      },
      { status: 500 }
    );
  }
}
