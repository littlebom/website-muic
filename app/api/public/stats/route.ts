import { NextResponse } from "next/server";
import { queryOne } from "@/lib/mysql-direct";
import { addCacheHeaders } from "@/lib/cache-headers";

export async function GET() {
    try {
        // 1. Fetch Local Data (Database)
        const [
            courses,
            instructors,
            institutions,
            categories,
            news,
            guides
        ] = await Promise.all([
            queryOne<{ count: number }>('SELECT COUNT(*) as count FROM courses'),
            queryOne<{ count: number }>('SELECT COUNT(*) as count FROM instructors'),
            queryOne<{ count: number }>('SELECT COUNT(*) as count FROM institutions'),
            queryOne<{ count: number }>('SELECT COUNT(*) as count FROM categories'),
            queryOne<{ count: number }>('SELECT COUNT(*) as count FROM news'),
            queryOne<{ count: number }>('SELECT COUNT(*) as count FROM guides WHERE is_active = 1')
        ]);

        // 2. Fetch External Data from Google Sheet
        let learners = 0;
        let certificates = 0;

        try {
            // Fetch Learners and Certificates from Google Sheet
            // Sheet URL: https://docs.google.com/spreadsheets/d/19H9Ue-U3hxZINYRLz2gRbmAD6B-TpmSffGzx8DF0t30
            // Format: CSV with headers "Student,Certificate" in row 1, values in row 2
            const sheetId = "19H9Ue-U3hxZINYRLz2gRbmAD6B-TpmSffGzx8DF0t30";
            const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

            const sheetRes = await fetch(csvUrl, {
                next: { revalidate: 300 } // Cache for 5 minutes
            });

            if (sheetRes.ok) {
                const csvText = await sheetRes.text();
                const lines = csvText.trim().split('\n');

                if (lines.length >= 2) {
                    // Parse CSV properly (handle quoted values with commas)
                    const dataLine = lines[1]; // Second line contains the data

                    // Simple CSV parser for quoted fields
                    const parseCSVLine = (line: string): string[] => {
                        const result: string[] = [];
                        let current = '';
                        let inQuotes = false;

                        for (let i = 0; i < line.length; i++) {
                            const char = line[i];

                            if (char === '"') {
                                inQuotes = !inQuotes;
                            } else if (char === ',' && !inQuotes) {
                                result.push(current);
                                current = '';
                            } else {
                                current += char;
                            }
                        }
                        result.push(current); // Push last value
                        return result;
                    };

                    const values = parseCSVLine(dataLine).map(v => {
                        // Remove commas from numbers like "318,330"
                        return parseInt(v.replace(/,/g, ''), 10);
                    });

                    if (values.length >= 1 && !isNaN(values[0])) {
                        learners = values[0]; // Student count from column A
                        console.log(`[Stats] Fetched ${learners} learners from Google Sheet`);
                    }

                    if (values.length >= 2 && !isNaN(values[1])) {
                        certificates = values[1]; // Certificate count from column B
                        console.log(`[Stats] Fetched ${certificates} certificates from Google Sheet`);
                    }
                }
            } else {
                console.warn("Google Sheet fetch failed:", sheetRes.status);
            }

            // Fallback if no data source worked
            if (learners === 0) {
                learners = 318330; // Fallback to last known value
            }
            if (certificates === 0) {
                certificates = 559756; // Fallback to last known value
            }

        } catch (error) {
            console.error("Failed to fetch external stats:", error);
        }

        const stats = {
            courses: courses?.count || 0, // Local courses only
            instructors: instructors?.count || 0,
            institutions: institutions?.count || 0,
            categories: categories?.count || 0,
            news: news?.count || 0,
            guides: guides?.count || 0,
            externalLearners: learners,
            certificates: certificates,
        };

        const response = NextResponse.json({
            success: true,
            data: stats,
        });

        // Cache for 1 hour
        addCacheHeaders(response.headers, 'LONG');

        return response;
    } catch (error) {
        console.error("Error fetching public stats:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
