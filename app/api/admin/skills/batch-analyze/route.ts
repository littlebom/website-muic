import { NextRequest, NextResponse } from "next/server";
import { getPendingCourses, saveCourseSkills, getAnalysisStats } from "@/lib/course-skills";
import { analyzeCourseSkills } from "@/lib/gemini";

export const maxDuration = 60; // Increase timeout for batch processing

export async function POST(request: NextRequest) {
    try {
        const { batchSize = 5, force = false } = await request.json();

        // 1. Get pending courses
        const courses = await getPendingCourses(batchSize);

        if (courses.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No pending courses to analyze",
                stats: await getAnalysisStats(),
                processed: 0
            });
        }

        console.log(`[Batch Analysis] Processing ${courses.length} courses...`);

        const results = [];
        let processedCount = 0;

        // 2. Process each course
        for (const course of courses) {
            try {
                console.log(`[Batch Analysis] Analyzing: ${course.title} (${course.id})`);

                // Parse tags safely
                let tags: string[] = [];
                try {
                    if (course.tags) {
                        if (course.tags.trim().startsWith('[')) {
                            tags = JSON.parse(course.tags);
                        } else {
                            tags = course.tags.split(',').map((t: string) => t.trim());
                        }
                    }
                } catch (e) { /* ignore */ }

                // Call Gemini
                const analysis = await analyzeCourseSkills({
                    id: course.id,
                    titleTh: course.title,
                    titleEn: course.titleEn,
                    description: course.description,
                    learningOutcomes: course.learningOutcomes,
                    targetAudience: course.targetAudience,
                    prerequisites: course.prerequisites,
                    tags: tags // Use parsed tags
                });

                // Save to DB
                await saveCourseSkills(course.id, {
                    ...analysis,
                    reasoning: analysis.reasoning || ""
                });

                results.push({ id: course.id, title: course.title, status: 'success' });
                processedCount++;

                // Small delay to prevent rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error: any) {
                console.error(`[Batch Analysis] Error processing course ${course.id}:`, error);
                results.push({ id: course.id, title: course.title, status: 'error', error: error.message });
            }
        }

        // 3. Return results and stats
        const stats = await getAnalysisStats();

        return NextResponse.json({
            success: true,
            processed: processedCount,
            results,
            stats
        });

    } catch (error: any) {
        console.error("[Batch Analysis] Critical Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function GET() {
    // Return current stats
    try {
        const stats = await getAnalysisStats();
        return NextResponse.json({ success: true, stats });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
    }
}
