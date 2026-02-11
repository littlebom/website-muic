import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/mysql-direct";

interface CSVInstructorData {
  name: string;
  nameEn: string;
  title: string;
  institutionId: string;
  bio?: string;
  imageUrl?: string;
  email?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instructors } = body;

    if (!instructors || !Array.isArray(instructors)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid data format. Expected array of instructors.",
        },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < instructors.length; i++) {
      const instructor = instructors[i] as CSVInstructorData;

      try {
        // Validate required fields
        if (!instructor.name || !instructor.nameEn || !instructor.title || !instructor.institutionId) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Missing required fields (name, nameEn, title, institutionId)`);
          continue;
        }

        // Check if institution exists
        const institution = await queryOne(
          'SELECT id FROM institutions WHERE id = ?',
          [instructor.institutionId]
        );
        if (!institution) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Institution ID "${instructor.institutionId}" not found`);
          continue;
        }

        // Generate ID
        const id = `instr-${Date.now()}-${i}`;
        const now = new Date();

        // Create instructor
        await execute(
          `INSERT INTO instructors (id, name, nameEn, title, institutionId, bio, imageUrl, email, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            instructor.name,
            instructor.nameEn,
            instructor.title,
            instructor.institutionId,
            instructor.bio || null,
            instructor.imageUrl || null,
            instructor.email || null,
            now,
            now
          ]
        );

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error.message || 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed. Success: ${results.success}, Failed: ${results.failed}`,
      results,
    });
  } catch (error: any) {
    console.error("Error importing instructors:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to import instructors",
      },
      { status: 500 }
    );
  }
}
