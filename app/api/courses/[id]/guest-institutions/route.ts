import { NextRequest, NextResponse } from "next/server";
import { query, execute, transaction } from "@/lib/mysql-direct";
import { nanoid } from "nanoid";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Find real ID incase courseCode is passed
        const course = await query<{ id: string }>(
            'SELECT id FROM courses WHERE id = ? OR courseCode = ?',
            [id, id]
        );

        if (!course || course.length === 0) {
            return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
        }

        const courseId = course[0].id;

        // Get list of institution request IDs that have this course as guest
        const guestLinks = await query<{ institutionId: string }>(
            'SELECT institutionId FROM institution_guest_courses WHERE courseId = ?',
            [courseId]
        );

        return NextResponse.json({
            success: true,
            data: guestLinks.map(l => l.institutionId)
        });
    } catch (error) {
        console.error("Error fetching guest institutions:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { institutionIds } = body; // Array of institution IDs to enable

        if (!Array.isArray(institutionIds)) {
            return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
        }

        // Find real ID incase courseCode is passed
        const course = await query<{ id: string }>(
            'SELECT id FROM courses WHERE id = ? OR courseCode = ?',
            [id, id]
        );

        if (!course || course.length === 0) {
            return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
        }

        const courseId = course[0].id;

        await transaction(async () => {
            // 1. Delete all existing links for this course
            await execute('DELETE FROM institution_guest_courses WHERE courseId = ?', [courseId]);

            // 2. Insert new links
            if (institutionIds.length > 0) {
                const values = institutionIds.map(instId => [instId, courseId]);
                // Flatten for basic execute if needed, or loop. mysql2 execute supports bulk insert? 
                // Simplest safe way loop or careful string building. 
                // Let's loop for safety with our helper, or build one query.

                // Construct bulk insert query
                const placeholders = institutionIds.map(() => '(?, ?, ?, 0)').join(', ');
                const flatValues = [];
                for (const instId of institutionIds) {
                    flatValues.push(nanoid(), instId, courseId);
                }

                await execute(
                    `INSERT INTO institution_guest_courses (id, institutionId, courseId, displayOrder) VALUES ${placeholders}`,
                    flatValues
                );
            }
        });

        return NextResponse.json({ success: true, message: "Updated successfully" });

    } catch (error) {
        console.error("Error updating guest institutions:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
