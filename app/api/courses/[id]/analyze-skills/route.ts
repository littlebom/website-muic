import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql-direct";
import { analyzeCourseSkills, type CourseData, type SkillAnalysis } from "@/lib/gemini";

interface Course {
  id: string;
  title: string;
  titleEn: string | null;
  description: string | null;
  learningOutcomes: string | null;
  level: string | null;
  targetAudience: string | null;
  prerequisites: string | null;
  tags: string | null;
  contentStructure: string | null;
}

interface Category {
  id: string;
  nameTh: string;
  nameEn: string | null;
}

interface SkillAnalysisRow {
  id: string;
  courseId: string;
  hardSkills: string;
  softSkills: string;
  reasoning: string | null;
  reasoningTh: string | null;
  reasoningEn: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GET /api/courses/[id]/analyze-skills
 * Returns AI-powered skill analysis for a course (with permanent caching)
 * Cache is cleared only when course content is updated
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;

    // Check cache first (no TTL - cache persists until course is updated)
    const cached = await query<SkillAnalysisRow>(
      `SELECT * FROM course_skill_analysis
       WHERE courseId = ?
       ORDER BY createdAt DESC
       LIMIT 1`,
      [courseId]
    );

    if (cached.length > 0) {
      const cacheAge = Date.now() - new Date(cached[0].createdAt).getTime();

      // Return cached result (always valid until manually cleared)
      // MySQL returns JSON columns as objects already, no need to parse
      const hardSkills = typeof cached[0].hardSkills === 'string'
        ? JSON.parse(cached[0].hardSkills)
        : cached[0].hardSkills;
      const softSkills = typeof cached[0].softSkills === 'string'
        ? JSON.parse(cached[0].softSkills)
        : cached[0].softSkills;

      return NextResponse.json({
        success: true,
        data: {
          hardSkills,
          softSkills,
          reasoning: cached[0].reasoning,
          reasoningTh: cached[0].reasoningTh || cached[0].reasoning,
          reasoningEn: cached[0].reasoningEn || cached[0].reasoning,
        },
        cached: true,
        cacheAge: Math.floor(cacheAge / 1000 / 60 / 60), // hours
      });
    }

    // Fetch course data
    const courses = await query<Course>(
      "SELECT * FROM courses WHERE id = ?",
      [courseId]
    );

    if (courses.length === 0) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    const course = courses[0];

    // Fetch categories
    const categories = await query<Category>(
      `SELECT c.* FROM categories c
       INNER JOIN course_categories cc ON c.id = cc.categoryId
       WHERE cc.courseId = ?`,
      [courseId]
    );

    // Prepare course data for AI analysis
    const courseData: CourseData = {
      id: course.id,
      titleTh: course.title,
      titleEn: course.titleEn || undefined,
      description: course.description || undefined,
      learningOutcomes: course.learningOutcomes || undefined,
      categories: categories.map((c) => c.nameTh),
      level: course.level || undefined,
      targetAudience: course.targetAudience || undefined,
      prerequisites: course.prerequisites || undefined,
      tags: course.tags ? course.tags.split(",").map((t) => t.trim()) : undefined,
      contentStructure: course.contentStructure || undefined,
    };

    // Analyze with Gemini AI
    console.log(`[AI Analysis] Analyzing course: ${course.title}`);
    const analysis = await analyzeCourseSkills(courseData);

    // Save to cache
    const analysisId = `skill_${courseId}_${Date.now()}`;
    await query(
      `INSERT INTO course_skill_analysis
       (id, courseId, hardSkills, softSkills, reasoning, reasoningTh, reasoningEn, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))
       ON DUPLICATE KEY UPDATE
       hardSkills = VALUES(hardSkills),
       softSkills = VALUES(softSkills),
       reasoning = VALUES(reasoning),
       reasoningTh = VALUES(reasoningTh),
       reasoningEn = VALUES(reasoningEn),
       updatedAt = NOW(3)`,
      [
        analysisId,
        courseId,
        JSON.stringify(analysis.hardSkills),
        JSON.stringify(analysis.softSkills),
        analysis.reasoning || analysis.reasoningTh,
        analysis.reasoningTh,
        analysis.reasoningEn,
      ]
    );

    return NextResponse.json({
      success: true,
      data: analysis,
      cached: false,
    });
  } catch (error) {
    console.error("[AI Analysis] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze course skills",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses/[id]/analyze-skills
 * Force re-analysis (clears cache and analyzes again)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;

    // Delete existing cache
    await query(
      "DELETE FROM course_skill_analysis WHERE courseId = ?",
      [courseId]
    );

    // Re-analyze by calling GET
    return GET(request, { params });
  } catch (error) {
    console.error("[AI Analysis] Error clearing cache:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear cache and re-analyze",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
