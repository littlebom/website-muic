import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/mysql-direct";

interface CSVInstitutionData {
  name: string;
  nameEn: string;
  abbreviation: string;
  logoUrl: string;
  website?: string;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { institutions } = body;

    if (!institutions || !Array.isArray(institutions)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid data format. Expected array of institutions.",
        },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < institutions.length; i++) {
      const institution = institutions[i] as CSVInstitutionData;

      try {
        // Validate required fields
        if (!institution.name || !institution.nameEn || !institution.abbreviation || !institution.logoUrl) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Missing required fields (name, nameEn, abbreviation, logoUrl)`);
          continue;
        }

        // Check for duplicate abbreviation
        const existing = await queryOne(
          'SELECT id FROM institutions WHERE abbreviation = ?',
          [institution.abbreviation]
        );
        if (existing) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Institution with abbreviation "${institution.abbreviation}" already exists`);
          continue;
        }

        // Generate ID: YYNNN format (e.g., 25001)
        const year = new Date().getFullYear().toString().slice(-2);
        const lastInstitution = await queryOne<{ id: string }>(
          'SELECT id FROM institutions ORDER BY id DESC LIMIT 1'
        );

        let sequence = 1;
        if (lastInstitution && lastInstitution.id.match(/^\d{5}$/)) {
          const lastYear = lastInstitution.id.slice(0, 2);
          if (lastYear === year) {
            sequence = parseInt(lastInstitution.id.slice(-3)) + 1;
          }
        }

        const id = `${year}${sequence.toString().padStart(3, '0')}`;
        const now = new Date();

        // Create institution
        await execute(
          `INSERT INTO institutions (id, name, nameEn, abbreviation, logoUrl, website, description, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            institution.name,
            institution.nameEn,
            institution.abbreviation,
            institution.logoUrl,
            institution.website || null,
            institution.description || null,
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
    console.error("Error importing institutions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to import institutions",
      },
      { status: 500 }
    );
  }
}
