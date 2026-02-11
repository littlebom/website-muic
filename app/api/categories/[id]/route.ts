import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/mysql-direct";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await queryOne(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Category not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch category",
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

    if (body.name) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.nameEn) {
      updates.push('nameEn = ?');
      values.push(body.nameEn);
    }
    if (body.icon) {
      updates.push('icon = ?');
      values.push(body.icon);
    }

    updates.push('updatedAt = ?');
    values.push(new Date());

    values.push(id);

    const result = await execute(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Category not found",
        },
        { status: 404 }
      );
    }

    const updatedCategory = await queryOne(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      data: updatedCategory,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update category",
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

    // Check if category has any courses
    const coursesCount = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM course_categories WHERE categoryId = ?',
      [id]
    );

    if (coursesCount && coursesCount.count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `ไม่สามารถลบหมวดหมู่ได้ เนื่องจากมีรายวิชาที่ใช้หมวดหมู่นี้อยู่ ${coursesCount.count} รายวิชา`,
        },
        { status: 400 }
      );
    }

    const result = await execute('DELETE FROM categories WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Category not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete category",
      },
      { status: 500 }
    );
  }
}
