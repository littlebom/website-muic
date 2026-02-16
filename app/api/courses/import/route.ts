import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/mysql-direct";
import { redisCache } from "@/lib/redis-cache";

interface CSVCourseData {
  // Support both old and new CSV format
  ID?: string;
  title?: string;
  'Title (TH)'?: string;
  titleEn?: string;
  'Title (EN)'?: string;
  description?: string;
  Description?: string;
  institutionId?: string;
  Institution?: string;
  instructorId?: string;
  Instructor?: string;
  imageId?: string;
  'Image URL'?: string;
  bannerImageId?: string;
  'Banner Image URL'?: string;
  level?: string;
  Level?: string;
  durationHours?: string;
  'Duration (Hours)'?: string;
  learningOutcomes?: string;
  'Learning Outcomes'?: string;
  targetAudience?: string;
  'Target Audience'?: string;
  prerequisites?: string;
  Prerequisites?: string;
  tags?: string;
  Tags?: string;
  courseUrl?: string;
  'Course URL'?: string;
  videoUrl?: string;
  'Video URL'?: string;
  teachingLanguage?: string;
  'Teaching Language'?: string;
  hasCertificate?: string;
  'Has Certificate'?: string;
  categoryIds?: string;
  Categories?: string; // comma-separated
  courseTypeIds?: string;
  'Course Types'?: string; // comma-separated
  enrollCount?: string;
  'Enroll Count'?: string;
  createdAt?: string;
  'Created At'?: string;
  updatedAt?: string;
  'Updated At'?: string;

  // New columns
  assessmentCriteria?: string;
  'Assessment Criteria'?: string;
  contentStructure?: string;
  'Content Structure'?: string;
  developmentYear?: string;
  'Development Year'?: string;
}

// Helper function to get value from course object with robust key matching
function findValue(course: any, keys: string[]): string | undefined {
  const courseKeys = Object.keys(course);
  for (const requestedKey of keys) {
    // Try exact match first
    if (course[requestedKey] !== undefined && course[requestedKey] !== null) {
      return String(course[requestedKey]).trim();
    }

    // Try normalized match (ignore case, spaces, underscores, and parentheses)
    const normalize = (s: string) => s.toLowerCase().replace(/[\s_()]/g, '');
    const normalizedRequested = normalize(requestedKey);
    const foundKey = courseKeys.find(k => normalize(k) === normalizedRequested);

    if (foundKey && course[foundKey] !== undefined && course[foundKey] !== null) {
      return String(course[foundKey]).trim();
    }
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courses } = body;

    if (courses && courses.length > 0) {
      console.log('[Import] Received first row keys:', Object.keys(courses[0]));
    }

    // Fetch all categories for name-to-id mapping
    const allCategories = await query<any>('SELECT id, name, nameEn FROM categories');
    const categoryMap = new Map<string, string>();

    // Create normalized map (lowercase name -> id)
    allCategories.forEach(cat => {
      if (cat.name) categoryMap.set(cat.name.toLowerCase().trim(), cat.id);
      if (cat.nameEn) categoryMap.set(cat.nameEn.toLowerCase().trim(), cat.id);
    });

    // Fetch all course types for name-to-id mapping
    const allCourseTypes = await query<any>('SELECT id, name, nameEn FROM course_types');
    const courseTypeMap = new Map<string, string>();

    // Create normalized map (lowercase name -> id)
    allCourseTypes.forEach(ctype => {
      if (ctype.name) courseTypeMap.set(ctype.name.toLowerCase().trim(), ctype.id);
      if (ctype.nameEn) courseTypeMap.set(ctype.nameEn.toLowerCase().trim(), ctype.id);
    });

    if (!courses || !Array.isArray(courses)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid data format. Expected array of courses.",
        },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < courses.length; i++) {
      const course = courses[i] as CSVCourseData;

      try {
        // Extract values supporting various header formats
        const title = findValue(course, ['Title (TH)', 'title', 'titleTh']);
        const titleEn = findValue(course, ['Title (EN)', 'titleEn', 'title_en']);
        const description = findValue(course, ['Description', 'description']);

        // Skip empty rows (where all main fields are missing)
        if (!title && !titleEn && !description && !Object.keys(course).length) {
          continue;
        }

        // Validate required fields
        if (!title && !titleEn && !description) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Missing required fields (Title (TH), Title (EN), Description)`);
          continue;
        }

        // Extract all fields with support for both formats
        const id = findValue(course, ['ID', 'id']);
        const courseCode = findValue(course, ['Course Code', 'courseCode']);
        const institutionName = findValue(course, ['Institution', 'institutionId']);
        const instructorName = findValue(course, ['Instructor', 'instructorId']);
        const level = findValue(course, ['Level', 'level']);
        const durationHours = findValue(course, ['Duration (Hours)', 'durationHours']);
        const learningOutcomesRaw = findValue(course, ['Learning Outcomes', 'learningOutcomes']);
        const targetAudience = findValue(course, ['Target Audience', 'targetAudience']);
        const prerequisites = findValue(course, ['Prerequisites', 'prerequisites']);
        const tags = findValue(course, ['Tags', 'tags']);
        const courseUrl = findValue(course, ['Course URL', 'courseUrl']);
        const videoUrl = findValue(course, ['Video URL', 'videoUrl']);
        const teachingLanguage = findValue(course, ['Teaching Language', 'teachingLanguage']);
        const hasCertificateRaw = findValue(course, ['Has Certificate', 'hasCertificate']);
        const imageId = findValue(course, ['Image URL', 'imageId']);
        const bannerImageId = findValue(course, ['Banner Image URL', 'bannerImageId']);
        const categoryIdsRaw = findValue(course, ['Categories', 'categoryIds']);
        const courseTypeIdsRaw = findValue(course, ['Course Types', 'courseTypeIds']);

        // New fields
        const assessmentCriteria = findValue(course, ['Assessment Criteria', 'assessmentCriteria']);
        const contentStructure = findValue(course, ['Content Structure', 'contentStructure']);
        const developmentYear = findValue(course, ['Development Year', 'developmentYear']);

        // Find institution ID by name (if name is provided instead of ID)
        let institutionId = null;
        if (institutionName) {
          // Check if it's already an ID (starts with 'inst-')
          if (institutionName.startsWith('inst-')) {
            institutionId = institutionName;
          } else {
            // Try to find by name
            const institution = await queryOne(
              'SELECT id FROM institutions WHERE name = ? LIMIT 1',
              [institutionName]
            );
            institutionId = institution ? institution.id : null;
          }
        }

        // Find instructor ID by name (if name is provided instead of ID)
        let instructorId = null;
        if (instructorName) {
          // Check if it's already an ID (starts with 'instr-')
          if (instructorName.startsWith('instr-')) {
            instructorId = instructorName;
          } else {
            // Try to find by name
            const instructor = await queryOne(
              'SELECT id FROM instructors WHERE name = ? LIMIT 1',
              [instructorName]
            );
            instructorId = instructor ? instructor.id : null;
          }
        }

        // Parse category IDs or Names
        const categoryIds: string[] = [];
        if (categoryIdsRaw) {
          const items = categoryIdsRaw.split(',').map(s => s.trim()).filter(s => s);

          for (const item of items) {
            // Check if it's a direct ID match (e.g. '01', '10')
            const isDirectId = allCategories.some(c => c.id === item);
            if (isDirectId) {
              categoryIds.push(item);
              continue;
            }

            // Try to find by name
            const mappedId = categoryMap.get(item.toLowerCase());
            if (mappedId) {
              categoryIds.push(mappedId);
            } else {
              // Optional: Log warning or create new category? 
              // For now, we'll try to use it as ID if it looks like one, or skip
              // console.log(`Warning: could not map category '${item}'`);
            }
          }
        }

        // Parse course type IDs or Names
        const courseTypeIds: string[] = [];
        if (courseTypeIdsRaw) {
          const items = courseTypeIdsRaw.split(',').map(s => s.trim()).filter(s => s);

          for (const item of items) {
            // Check if it's a direct ID match
            const isDirectId = allCourseTypes.some(c => c.id === item);
            if (isDirectId) {
              courseTypeIds.push(item);
              continue;
            }

            // Try to find by name
            const mappedId = courseTypeMap.get(item.toLowerCase());
            if (mappedId) {
              courseTypeIds.push(mappedId);
            }
          }
        }

        // Parse learning outcomes (JSON array or comma-separated)
        let learningOutcomes = "";
        if (learningOutcomesRaw) {
          try {
            // Try to parse as JSON first
            JSON.parse(learningOutcomesRaw);
            learningOutcomes = learningOutcomesRaw;
          } catch {
            // If not JSON, treat as comma-separated and convert to JSON
            const outcomes = learningOutcomesRaw.split(',').map(o => o.trim()).filter(o => o);
            learningOutcomes = JSON.stringify(outcomes);
          }
        }

        // Parse hasCertificate (Yes/No or true/false)
        const hasCertificate = hasCertificateRaw?.toLowerCase() === 'yes' ||
          hasCertificateRaw?.toLowerCase() === 'true' ||
          hasCertificateRaw === '1';

        const now = new Date();

        console.log(`[Import] Processing row ${i + 1}: ID=${id}, Code=${courseCode}, Title=${title}`);

        // Create course
        const execResult = await execute(
          `INSERT INTO courses (
            id, courseCode, title, titleEn, description, learningOutcomes, targetAudience,
            prerequisites, tags, courseUrl, videoUrl, institutionId, instructorId,
            imageId, bannerImageId, level, teachingLanguage, durationHours, hasCertificate,
            assessmentCriteria, contentStructure, developmentYear,
            enrollCount, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
          [
            id || `course-${Date.now()}-${i}`,
            courseCode || null,
            title,
            titleEn,
            description,
            learningOutcomes || null,
            targetAudience || null,
            prerequisites || null,
            tags || null,
            courseUrl || null,
            videoUrl || null,
            institutionId,
            instructorId,
            imageId || null,
            bannerImageId || null,
            level || null,
            teachingLanguage || null,
            durationHours ? parseInt(durationHours) : null,
            hasCertificate,
            assessmentCriteria || null,
            contentStructure || null,
            developmentYear ? parseInt(developmentYear) : null,
            now,
            now
          ]
        );

        console.log(`[Import] Row ${i + 1} Inserted: affectedRows=${execResult.affectedRows}`);

        // Update ID if it was generated
        const finalId = id || `course-${Date.now()}-${i}`;

        // Create category relations
        if (categoryIds.length > 0) {
          for (const categoryId of categoryIds) {
            try {
              await execute(
                'INSERT INTO course_categories (courseId, categoryId) VALUES (?, ?)',
                [finalId, categoryId]
              );
            } catch (err) {
              // Skip duplicates
            }
          }
        }

        // Create course type relations
        if (courseTypeIds.length > 0) {
          for (const courseTypeId of courseTypeIds) {
            try {
              await execute(
                'INSERT INTO course_course_types (courseId, courseTypeId) VALUES (?, ?)',
                [finalId, courseTypeId]
              );
            } catch (err) {
              // Skip duplicates
            }
          }
        }

        results.success++;
      } catch (error: any) {
        console.error(`[Import] Error at Row ${i + 1}:`, error);
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error.message || 'Unknown error'}`);
      }
    }

    console.log('[Import] Finished. Results:', results);

    // Clear cache if at least one course was successfully imported
    if (results.success > 0) {
      try {
        await redisCache.clearPattern('courses:*');
        console.log('[Import] Cache invalidated for courses:*');
      } catch (cacheError) {
        console.error('[Import] Failed to clear cache:', cacheError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed. Success: ${results.success}, Failed: ${results.failed}`,
      results,
    });
  } catch (error: any) {
    console.error("Error importing courses:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to import courses",
      },
      { status: 500 }
    );
  }
}
