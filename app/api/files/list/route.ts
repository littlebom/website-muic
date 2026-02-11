import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";
import { getInstitutionRelatedFiles } from "@/lib/data";
import { getUploadsDir } from "@/lib/path-utils";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface FileInfo {
    name: string;
    path: string;
    url: string;
    size: number;
    modifiedAt: Date;
    type: 'file' | 'directory';
    category?: string;
}

async function getFiles(dir: string, baseDir: string): Promise<FileInfo[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: FileInfo[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(baseDir, fullPath);

        // Skip hidden files
        if (entry.name.startsWith('.')) continue;

        if (entry.isDirectory()) {
            // Recursively get files from subdirectories
            const subFiles = await getFiles(fullPath, baseDir);
            files.push(...subFiles);
        } else {
            const stats = await stat(fullPath);
            const category = path.dirname(relativePath).split(path.sep)[0];

            files.push({
                name: entry.name,
                path: relativePath,
                url: `/uploads/${relativePath}`,
                size: stats.size,
                modifiedAt: stats.mtime,
                type: 'file',
                category: category === '.' ? 'uncategorized' : category,
            });
        }
    }

    return files;
}

export async function GET() {
    try {
        const uploadsDir = getUploadsDir();

        // Ensure uploads directory exists
        try {
            await stat(uploadsDir);
        } catch {
            return NextResponse.json({ success: true, files: [] });
        }

        let files = await getFiles(uploadsDir, uploadsDir);

        // === FILTERING ===
        const session = await getSession();
        if (session && session.role === 'institution_admin' && session.institutionId) {
            const institutionId = session.institutionId;
            const relatedUrls = await getInstitutionRelatedFiles(institutionId);
            const relatedFilenames = new Set(relatedUrls.map(url => path.basename(url)));

            // Also include any new files they might have uploaded that are prefixed with inst-{id} if we implement that later
            // For now, filter by strictly what is IN THE DB.
            // AND also include files that appear to belong to them by naming convention if any?
            // Just DB usage is safer + maybe loose match?

            files = files.filter(f => relatedFilenames.has(f.name));
        }
        // =================

        // Sort by modified time (newest first)
        files.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());

        return NextResponse.json({
            success: true,
            files,
        });
    } catch (error) {
        console.error("Error listing files:", error);
        return NextResponse.json(
            { success: false, error: "Failed to list files" },
            { status: 500 }
        );
    }
}
