import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/mysql-direct";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const institution = await queryOne(
      'SELECT * FROM institutions WHERE id = ?',
      [id]
    );

    if (!institution) {
      return NextResponse.json(
        {
          success: false,
          error: "Institution not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: institution,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch institution",
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
    if (body.abbreviation) {
      updates.push('abbreviation = ?');
      values.push(body.abbreviation);
    }
    if (body.logoUrl) {
      updates.push('logoUrl = ?');
      values.push(body.logoUrl);
    }
    if (body.website !== undefined) {
      updates.push('website = ?');
      values.push(body.website);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
    }
    if (body.bannerUrl !== undefined) {
      updates.push('bannerUrl = ?');
      values.push(body.bannerUrl);
    }
    if (body.primaryColor !== undefined) {
      updates.push('primaryColor = ?');
      values.push(body.primaryColor);
    }
    if (body.secondaryColor !== undefined) {
      updates.push('secondaryColor = ?');
      values.push(body.secondaryColor);
    }
    if (body.address !== undefined) {
      updates.push('address = ?');
      values.push(body.address);
    }
    if (body.phoneNumber !== undefined) {
      updates.push('phoneNumber = ?');
      values.push(body.phoneNumber);
    }
    if (body.email !== undefined) {
      updates.push('email = ?');
      values.push(body.email);
    }
    if (body.socialLinks !== undefined) {
      updates.push('socialLinks = ?');
      values.push(JSON.stringify(body.socialLinks));
    }
    if (body.metaTitle !== undefined) {
      updates.push('metaTitle = ?');
      values.push(body.metaTitle);
    }
    if (body.metaDescription !== undefined) {
      updates.push('metaDescription = ?');
      values.push(body.metaDescription);
    }
    if (body.micrositeEnabled !== undefined) {
      updates.push('micrositeEnabled = ?');
      values.push(body.micrositeEnabled ? 1 : 0);
    }

    updates.push('updatedAt = ?');
    values.push(new Date());

    values.push(id);

    const result = await execute(
      `UPDATE institutions SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Institution not found",
        },
        { status: 404 }
      );
    }

    const updatedInstitution = await queryOne(
      'SELECT * FROM institutions WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      data: updatedInstitution,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update institution",
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

    // Check if institution has any courses
    const coursesCount = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM courses WHERE institutionId = ?',
      [id]
    );

    if (coursesCount && coursesCount.count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `ไม่สามารถลบสถาบันได้ เนื่องจากมีรายวิชาที่สังกัดสถาบันนี้อยู่ ${coursesCount.count} รายวิชา`,
        },
        { status: 400 }
      );
    }

    // Check if institution has any instructors
    const instructorsCount = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM instructors WHERE institutionId = ?',
      [id]
    );

    if (instructorsCount && instructorsCount.count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `ไม่สามารถลบสถาบันได้ เนื่องจากมีอาจารย์ที่สังกัดสถาบันนี้อยู่ ${instructorsCount.count} คน`,
        },
        { status: 400 }
      );
    }

    const result = await execute('DELETE FROM institutions WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Institution not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Institution deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete institution",
      },
      { status: 500 }
    );
  }
}
