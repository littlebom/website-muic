import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/mysql-direct";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log("Delete placeholder request:", id);

    // Delete the placeholder from database
    const result = await execute('DELETE FROM image_placeholders WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Placeholder not found" },
        { status: 404 }
      );
    }

    console.log("Placeholder deleted successfully:", id);

    return NextResponse.json({
      success: true,
      message: "Placeholder deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting placeholder:", error);

    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete placeholder" },
      { status: 500 }
    );
  }
}
