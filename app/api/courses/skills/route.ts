import { NextResponse } from "next/server";
import { query } from "@/lib/mysql-direct";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const sql = `
      SELECT 
        courseId,
        hardSkills,
        softSkills,
        reasoning,
        updatedAt
      FROM course_skill_analysis
    `;

        const skills = await query(sql);

        return NextResponse.json({
            success: true,
            data: skills
        });
    } catch (error: any) {
        console.error("Error fetching all course skills:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch course skills" },
            { status: 500 }
        );
    }
}
