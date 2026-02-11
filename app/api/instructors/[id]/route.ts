import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/mysql-direct";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const instructor = await queryOne(
      'SELECT * FROM instructors WHERE id = ?',
      [id]
    );

    if (!instructor) {
      return NextResponse.json(
        {
          success: false,
          error: "Instructor not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: instructor,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch instructor",
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
    if (body.title) {
      updates.push('title = ?');
      values.push(body.title);
    }
    if (body.institutionId) {
      updates.push('institutionId = ?');
      values.push(body.institutionId);
    }
    if (body.bio !== undefined) {
      updates.push('bio = ?');
      values.push(body.bio);
    }
    if (body.imageUrl !== undefined) {
      updates.push('imageUrl = ?');
      values.push(body.imageUrl);
    }
    if (body.email !== undefined) {
      updates.push('email = ?');
      values.push(body.email);
    }

    updates.push('updatedAt = ?');
    values.push(new Date());

    values.push(id);

    const result = await execute(
      `UPDATE instructors SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Instructor not found",
        },
        { status: 404 }
      );
    }

    const updatedInstructor = await queryOne(
      'SELECT * FROM instructors WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      data: updatedInstructor,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update instructor",
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

    // Check if instructor has any courses
    const coursesCount = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM courses WHERE instructorId = ?',
      [id]
    );

    if (coursesCount && coursesCount.count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `ไม่สามารถลบอาจารย์ได้ เนื่องจากมีรายวิชาที่สอนอยู่ ${coursesCount.count} รายวิชา`,
        },
        { status: 400 }
      );
    }

    const result = await execute('DELETE FROM instructors WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Instructor not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Instructor deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete instructor",
      },
      { status: 500 }
    );
  }
}
