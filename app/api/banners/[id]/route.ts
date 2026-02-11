import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { queryOne, execute } from "@/lib/mysql-direct";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const banner = await queryOne(
      'SELECT * FROM banners WHERE id = ?',
      [id]
    );

    if (!banner) {
      return NextResponse.json(
        {
          success: false,
          error: "Banner not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch banner",
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
    if (body.subtitle !== undefined) {
      updates.push('subtitle = ?');
      values.push(body.subtitle || null);
    }
    if (body.subtitleEn !== undefined) {
      updates.push('subtitleEn = ?');
      values.push(body.subtitleEn || null);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description || null);
    }
    if (body.descriptionEn !== undefined) {
      updates.push('descriptionEn = ?');
      values.push(body.descriptionEn || null);
    }
    if (body.buttonText !== undefined) {
      updates.push('buttonText = ?');
      values.push(body.buttonText || null);
    }
    if (body.buttonTextEn !== undefined) {
      updates.push('buttonTextEn = ?');
      values.push(body.buttonTextEn || null);
    }
    if (body.imageId !== undefined) {
      updates.push('imageId = ?');
      values.push(body.imageId || "");
    }
    if (body.backgroundImageId !== undefined) {
      updates.push('backgroundImageId = ?');
      values.push(body.backgroundImageId || null);
    }
    if (body.overlayImageId !== undefined) {
      updates.push('overlayImageId = ?');
      values.push(body.overlayImageId || null);
    }
    if (body.linkUrl !== undefined) {
      updates.push('linkUrl = ?');
      values.push(body.linkUrl || null);
    }
    if (body.backgroundColor !== undefined) {
      updates.push('backgroundColor = ?');
      values.push(body.backgroundColor || null);
    }
    if (body.textColor !== undefined) {
      updates.push('textColor = ?');
      values.push(body.textColor || null);
    }
    if (body.accentColor !== undefined) {
      updates.push('accentColor = ?');
      values.push(body.accentColor || null);
    }
    if (body.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(body.isActive);
    }
    if (body.order !== undefined) {
      updates.push('`order` = ?');
      values.push(body.order);
    }
    if (body.templateId !== undefined) {
      updates.push('templateId = ?');
      values.push(body.templateId || null);
    }
    if (body.showSearchBox !== undefined) {
      updates.push('showSearchBox = ?');
      values.push(body.showSearchBox);
    }
    if (body.overlayOpacity !== undefined) {
      updates.push('overlayOpacity = ?');
      values.push(body.overlayOpacity);
    }
    if (body.linkTarget !== undefined) {
      updates.push('linkTarget = ?');
      values.push(body.linkTarget || '_self');
    }

    updates.push('updatedAt = ?');
    values.push(new Date());

    values.push(id);

    const result = await execute(
      `UPDATE banners SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Banner not found",
        },
        { status: 404 }
      );
    }

    const updatedBanner = await queryOne(
      'SELECT * FROM banners WHERE id = ?',
      [id]
    );

    // Revalidate the cache for banner pages
    revalidatePath("/admin/banners");
    revalidatePath(`/admin/banners/${id}`);
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      data: updatedBanner,
    });
  } catch (error: any) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update banner",
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
    const result = await execute('DELETE FROM banners WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Banner not found",
        },
        { status: 404 }
      );
    }

    // Revalidate the cache for banner pages
    revalidatePath("/admin/banners");
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete banner",
      },
      { status: 500 }
    );
  }
}
