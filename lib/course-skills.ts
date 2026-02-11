import { query, execute, queryOne } from "@/lib/mysql-direct";
import { CourseSkills } from "@/lib/types";
import { nanoid } from "nanoid";

/**
 * Save analysis results to database
 */
import { SkillScores, SoftSkillScores } from "@/lib/gemini";

/**
 * Save analysis results to database
 */
export async function saveCourseSkills(
    courseId: string,
    analysis: {
        hardSkills: SkillScores,
        softSkills: SoftSkillScores,
        reasoning: string
    }
) {
    // Check if exists
    const existing = await queryOne<{ id: string }>("SELECT id FROM course_skills WHERE courseId = ?", [courseId]);

    if (existing) {
        // Update
        await execute(
            `UPDATE course_skills SET 
        h1=?, h2=?, h3=?, h4=?, h5=?, h6=?, 
        s1=?, s2=?, s3=?, s4=?, s5=?, s6=?, 
        reasoning=?, version=version+1, updatedAt=NOW()
       WHERE courseId = ?`,
            [
                analysis.hardSkills.H1, analysis.hardSkills.H2, analysis.hardSkills.H3, analysis.hardSkills.H4, analysis.hardSkills.H5, analysis.hardSkills.H6,
                analysis.softSkills.S1, analysis.softSkills.S2, analysis.softSkills.S3, analysis.softSkills.S4, analysis.softSkills.S5, analysis.softSkills.S6,
                analysis.reasoning,
                courseId
            ]
        );
    } else {
        // Insert
        await execute(
            `INSERT INTO course_skills (
        id, courseId, 
        h1, h2, h3, h4, h5, h6, 
        s1, s2, s3, s4, s5, s6, 
        reasoning
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nanoid(), courseId,
                analysis.hardSkills.H1, analysis.hardSkills.H2, analysis.hardSkills.H3, analysis.hardSkills.H4, analysis.hardSkills.H5, analysis.hardSkills.H6,
                analysis.softSkills.S1, analysis.softSkills.S2, analysis.softSkills.S3, analysis.softSkills.S4, analysis.softSkills.S5, analysis.softSkills.S6,
                analysis.reasoning
            ]
        );
    }
}

/**
 * Get courses that haven't been analyzed yet
 */
export async function getPendingCourses(limit: number = 5) {
    // Find courses that NOT EXIST in course_skills table
    return await query<any>(
        `SELECT c.* 
     FROM courses c 
     LEFT JOIN course_skills cs ON c.id = cs.courseId
     WHERE cs.id IS NULL
     AND c.title IS NOT NULL
     AND c.title IS NOT NULL
     ORDER BY c.createdAt DESC
     LIMIT ${Number(limit)}`
    );
}

/**
 * Get analysis status statistics
 */
export async function getAnalysisStats() {
    const total = await queryOne<{ count: number }>("SELECT COUNT(*) as count FROM courses");
    const analyzed = await queryOne<{ count: number }>("SELECT COUNT(*) as count FROM course_skills");

    return {
        total: total?.count || 0,
        analyzed: analyzed?.count || 0,
        pending: (total?.count || 0) - (analyzed?.count || 0)
    };
}
