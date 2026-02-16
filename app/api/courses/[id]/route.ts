import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute, transaction } from "@/lib/mysql-direct";
import { redisCache } from "@/lib/redis-cache";

interface Course {
  id: string;
  courseCode: string | null;
  title: string;
  titleEn: string;
  description: string;
  learningOutcomes: string | null;
  targetAudience: string | null;
  prerequisites: string | null;
  tags: string | null;
  assessmentCriteria: string | null;
  courseUrl: string | null;
  videoUrl: string | null;
  contentStructure: string | null;
  institutionId: string | null;
  instructorId: string | null;
  imageId: string | null;
  bannerImageId: string | null;
  level: string | null;
  teachingLanguage: string | null;
  durationHours: number | null;
  developmentYear?: number | null;
  hasCertificate: boolean;
  enrollCount: number;
  createdAt: Date;
  updatedAt: Date;
  course_instructors?: any[];
  course_categories?: any[];
  course_course_types?: any[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Try to find by ID or courseCode
    const course = await queryOne<Course>(
      'SELECT * FROM courses WHERE id = ? OR courseCode = ?',
      [id, id]
    );

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: "Course not found",
        },
        { status: 404 }
      );
    }

    // Use the real ID for relation queries
    const realId = course.id;

    // Fetch relations
    course.course_instructors = await query(
      'SELECT * FROM course_instructors WHERE courseId = ?',
      [realId]
    );
    course.course_categories = await query(
      'SELECT * FROM course_categories WHERE courseId = ?',
      [realId]
    );
    course.course_course_types = await query(
      'SELECT * FROM course_course_types WHERE courseId = ?',
      [realId]
    );

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch course",
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
    const { id: paramId } = await params;
    const body = await request.json();

    // Resolve real ID first
    const existingCourse = await queryOne<Course>(
      'SELECT id, courseCode FROM courses WHERE id = ? OR courseCode = ?',
      [paramId, paramId]
    );

    if (!existingCourse) {
      return NextResponse.json(
        {
          success: false,
          error: "Course not found",
        },
        { status: 404 }
      );
    }

    const id = existingCourse.id;

    await transaction(async (exec) => {
      // Build UPDATE query dynamically
      const updates: string[] = [];
      const values: any[] = [];

      if (body.courseCode) {
        updates.push('courseCode = ?');
        values.push(body.courseCode);
      }
      if (body.title) {
        updates.push('title = ?');
        values.push(body.title);
      }
      if (body.titleEn) {
        updates.push('titleEn = ?');
        values.push(body.titleEn);
      }
      if (body.description) {
        updates.push('description = ?');
        values.push(body.description);
      }
      if (body.learningOutcomes !== undefined) {
        updates.push('learningOutcomes = ?');
        values.push(body.learningOutcomes);
      }
      if (body.targetAudience !== undefined) {
        updates.push('targetAudience = ?');
        values.push(body.targetAudience);
      }
      if (body.prerequisites !== undefined) {
        updates.push('prerequisites = ?');
        values.push(body.prerequisites);
      }
      if (body.tags !== undefined) {
        updates.push('tags = ?');
        values.push(body.tags);
      }
      if (body.assessmentCriteria !== undefined) {
        updates.push('assessmentCriteria = ?');
        values.push(body.assessmentCriteria);
      }
      if (body.courseUrl !== undefined) {
        updates.push('courseUrl = ?');
        values.push(body.courseUrl);
      }
      if (body.videoUrl !== undefined) {
        updates.push('videoUrl = ?');
        values.push(body.videoUrl);
      }
      if (body.contentStructure !== undefined) {
        updates.push('contentStructure = ?');
        values.push(body.contentStructure);
      }
      if (body.institutionId) {
        updates.push('institutionId = ?');
        values.push(body.institutionId);
      }
      if (body.instructorId) {
        updates.push('instructorId = ?');
        values.push(body.instructorId);
      }
      if (body.imageId) {
        updates.push('imageId = ?');
        values.push(body.imageId);
      }
      if (body.bannerImageId !== undefined) {
        updates.push('bannerImageId = ?');
        values.push(body.bannerImageId);
      }
      if (body.level) {
        updates.push('level = ?');
        values.push(body.level);
      }
      if (body.teachingLanguage !== undefined) {
        updates.push('teachingLanguage = ?');
        values.push(body.teachingLanguage);
      }
      if (body.durationHours !== undefined) {
        updates.push('durationHours = ?');
        values.push(body.durationHours);
      }
      if (body.developmentYear !== undefined) {
        updates.push('developmentYear = ?');
        values.push(body.developmentYear);
      }
      if (body.hasCertificate !== undefined) {
        updates.push('hasCertificate = ?');
        values.push(body.hasCertificate);
      }
      if (body.enrollCount !== undefined) {
        updates.push('enrollCount = ?');
        values.push(body.enrollCount);
      }
      if (body.isPopular !== undefined) {
        updates.push('isPopular = ?');
        values.push(body.isPopular);
      }

      // Always update updatedAt
      updates.push('updatedAt = ?');
      values.push(new Date());

      if (updates.length > 0) {
        values.push(id);
        await execute(
          `UPDATE courses SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }

      // Update categories if provided
      if (body.categoryIds && Array.isArray(body.categoryIds)) {
        await execute('DELETE FROM course_categories WHERE courseId = ?', [id]);
        for (const categoryId of body.categoryIds) {
          await execute(
            'INSERT INTO course_categories (courseId, categoryId) VALUES (?, ?)',
            [id, categoryId]
          );
        }
      }

      // Update course types if provided
      if (body.courseTypeIds && Array.isArray(body.courseTypeIds)) {
        await execute('DELETE FROM course_course_types WHERE courseId = ?', [id]);
        for (const courseTypeId of body.courseTypeIds) {
          await execute(
            'INSERT INTO course_course_types (courseId, courseTypeId) VALUES (?, ?)',
            [id, courseTypeId]
          );
        }
      }

      // Update instructors if provided
      if (body.instructorIds && Array.isArray(body.instructorIds)) {
        await execute('DELETE FROM course_instructors WHERE courseId = ?', [id]);
        for (const instructorId of body.instructorIds) {
          await execute(
            'INSERT INTO course_instructors (courseId, instructorId) VALUES (?, ?)',
            [id, instructorId]
          );
        }
      } else if (body.instructorId) {
        await execute('DELETE FROM course_instructors WHERE courseId = ?', [id]);
        await execute(
          'INSERT INTO course_instructors (courseId, instructorId) VALUES (?, ?)',
          [id, body.instructorId]
        );
      }
    });

    // Clear cache after update
    await redisCache.clearPattern('courses:*');
    await redisCache.delete(`course:${id}`);

    // Also try to clear by courseCode if we can leverage the body or existing data
    if (existingCourse.courseCode) {
      await redisCache.delete(`course:${existingCourse.courseCode}`);
    }
    if (body.courseCode && body.courseCode !== existingCourse.courseCode) {
      await redisCache.delete(`course:${body.courseCode}`);
    }

    // Clear skill analysis cache when course is updated (optional table)
    try {
      await execute(
        'DELETE FROM course_skill_analysis WHERE courseId = ?',
        [id]
      );
      console.log(`[Cache] Cleared skill analysis cache for course: ${id}`);
    } catch (error: any) {
      // Table might not exist yet - ignore error
      if (error.code !== 'ER_NO_SUCH_TABLE') {
        console.error('[Cache] Failed to clear skill analysis cache:', error);
      }
    }

    const updatedCourse = await queryOne<Course>(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );

    if (!updatedCourse) {
      return NextResponse.json(
        {
          success: false,
          error: "Course not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCourse,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update course",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // PATCH uses the same logic as PUT
  return PUT(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawParamId } = await params;
    const paramId = decodeURIComponent(rawParamId);

    console.log(`[DELETE] Request for ID: ${rawParamId} -> Decoded: ${paramId}`);

    // Resolve real ID first
    const existingCourse = await queryOne<Course>(
      'SELECT id, title, courseCode FROM courses WHERE id = ? OR courseCode = ?',
      [paramId, paramId]
    );

    if (!existingCourse) {
      console.log(`[DELETE] Course not found for param: ${paramId}`);
      return NextResponse.json(
        {
          success: false,
          error: `Course not found (ID: ${paramId})`,
        },
        { status: 404 }
      );
    }

    console.log(`[DELETE] Found course: ${existingCourse.title} (${existingCourse.id})`);

    const id = existingCourse.id;

    const result = await execute('DELETE FROM courses WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Course not found",
        },
        { status: 404 }
      );
    }

    // Clear cache
    await redisCache.clearPattern('courses:*');
    await redisCache.delete(`course:${id}`);

    // Clear by courseCode if available
    if (existingCourse.courseCode) {
      await redisCache.delete(`course:${existingCourse.courseCode}`);
    }

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete course",
      },
      { status: 500 }
    );
  }
}
