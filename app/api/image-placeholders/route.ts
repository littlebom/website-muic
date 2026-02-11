import { NextResponse } from "next/server";
import { getImagePlaceholders } from "@/lib/data";

export async function GET() {
  try {
    const placeholders = await getImagePlaceholders();
    return NextResponse.json({
      success: true,
      data: placeholders,
    });
  } catch (error: any) {
    console.error("Error fetching image placeholders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch image placeholders" },
      { status: 500 }
    );
  }
}
