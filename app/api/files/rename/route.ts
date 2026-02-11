import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getUploadsDir } from "@/lib/path-utils";

export async function POST(request: NextRequest) {
    try {
        const { oldPath, newName } = await request.json();

        if (!oldPath || !newName) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate new name (prevent directory traversal)
        if (newName.includes("/") || newName.includes("\\") || newName.includes("..")) {
            return NextResponse.json(
                { success: false, error: "Invalid filename" },
                { status: 400 }
            );
        }

        // Determine the absolute path
        // Note: oldPath comes from the frontend, which might be a relative URL path like /uploads/courses/image.png
        // We need to convert it to a filesystem path.



        // Assuming uploads are in public/uploads
        // Use getUploadsDir and get parent directory to ensure correct 'public' root
        const publicDir = path.dirname(getUploadsDir());
        let relativePath = oldPath;

        if (relativePath.startsWith("/")) {
            relativePath = relativePath.substring(1);
        }

        const absoluteOldPath = path.join(publicDir, relativePath);
        const directory = path.dirname(absoluteOldPath);
        const extension = path.extname(absoluteOldPath);

        // Construct new path
        // Keep the same extension if the user didn't provide one, or validate it matches
        let finalNewName = newName;
        if (!path.extname(newName)) {
            finalNewName = newName + extension;
        }

        const absoluteNewPath = path.join(directory, finalNewName);

        // Check if file exists
        if (!fs.existsSync(absoluteOldPath)) {
            return NextResponse.json(
                { success: false, error: "File not found" },
                { status: 404 }
            );
        }

        // Check if new name already exists
        if (fs.existsSync(absoluteNewPath)) {
            return NextResponse.json(
                { success: false, error: "A file with this name already exists" },
                { status: 409 }
            );
        }

        // Rename the file
        fs.renameSync(absoluteOldPath, absoluteNewPath);

        // Return the new URL
        const newUrl = "/" + path.relative(publicDir, absoluteNewPath).replace(/\\/g, "/");

        return NextResponse.json({
            success: true,
            newUrl: newUrl,
            newName: finalNewName
        });

    } catch (error) {
        console.error("Error renaming file:", error);
        return NextResponse.json(
            { success: false, error: "Failed to rename file" },
            { status: 500 }
        );
    }
}
