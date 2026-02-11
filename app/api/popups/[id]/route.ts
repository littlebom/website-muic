import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { queryOne, execute } from "@/lib/mysql-direct";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const popup = await queryOne(
      'SELECT * FROM popups WHERE id = ?',
      [id]
    );

    if (!popup) {
      return NextResponse.json(
        {
          success: false,
          error: "Popup not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: popup,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch popup",
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

    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title);
    }
    if (body.titleEn !== undefined) {
      updates.push('titleEn = ?');
      values.push(body.titleEn);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description || null);
    }
    if (body.descriptionEn !== undefined) {
      updates.push('descriptionEn = ?');
      values.push(body.descriptionEn || null);
    }
    if (body.imageId !== undefined) {
      updates.push('imageId = ?');
      values.push(body.imageId);
    }
    if (body.linkUrl !== undefined) {
      updates.push('linkUrl = ?');
      values.push(body.linkUrl || null);
    }
    if (body.buttonText !== undefined) {
      updates.push('buttonText = ?');
      values.push(body.buttonText || null);
    }
    if (body.buttonTextEn !== undefined) {
      updates.push('buttonTextEn = ?');
      values.push(body.buttonTextEn || null);
    }
    if (body.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(body.isActive);
    }
    if (body.startDate !== undefined) {
      updates.push('startDate = ?');
      values.push(body.startDate ? new Date(body.startDate) : null);
    }
    if (body.endDate !== undefined) {
      updates.push('endDate = ?');
      values.push(body.endDate ? new Date(body.endDate) : null);
    }
    if (body.displayOrder !== undefined) {
      updates.push('displayOrder = ?');
      values.push(body.displayOrder);
    }
    if (body.showOnce !== undefined) {
      updates.push('showOnce = ?');
      values.push(body.showOnce);
    }

    updates.push('updatedAt = ?');
    values.push(new Date());

    values.push(id);

    const result = await execute(
      `UPDATE popups SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Popup not found",
        },
        { status: 404 }
      );
    }

    const updatedPopup = await queryOne(
      'SELECT * FROM popups WHERE id = ?',
      [id]
    );

    // Revalidate the cache for popup pages
    revalidatePath("/admin/popups");
    revalidatePath(`/admin/popups/${id}`);
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      data: updatedPopup,
    });
  } catch (error: any) {
    console.error("Error updating popup:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update popup",
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
    const result = await execute('DELETE FROM popups WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Popup not found",
        },
        { status: 404 }
      );
    }

    // Revalidate the cache for popup pages
    revalidatePath("/admin/popups");
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      message: "Popup deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete popup",
      },
      { status: 500 }
    );
  }
}
