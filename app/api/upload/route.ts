import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { getUploadsDir } from "@/lib/path-utils";

// Configure route to handle file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Target dimensions for different image types
const TARGET_DIMENSIONS: Record<string, { width: number; height: number }> = {
  banner: { width: 1940, height: 485 },
  'banner-square': { width: 800, height: 800 },
  course: { width: 900, height: 506 },
  instructor: { width: 400, height: 400 },
  news: { width: 900, height: 506 },
  institution: { width: 400, height: 400 },
  square: { width: 800, height: 800 },
  default: { width: 800, height: 600 },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const rawImageType = (formData.get("imageType") as string) || "default";
    const imageType = rawImageType.toLowerCase();

    console.log("DEBUG UPLOAD:", {
      filename: file.name,
      rawImageType: `"${rawImageType}"`,
      processedImageType: `"${imageType}"`,
      isBanner: imageType === 'banner',
      targetDimensions: TARGET_DIMENSIONS[imageType]
    });

    if (!file) {
      console.error("Upload error: No file provided");
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    console.log("File upload attempt:", {
      name: file.name,
      type: file.type,
      size: file.size,
      imageType,
    });

    // Validate file type - check both MIME type and extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = path.extname(file.name).toLowerCase();
    const isValidMimeType = file.type.startsWith("image/");
    const isValidExtension = allowedExtensions.includes(fileExtension);

    if (!isValidMimeType && !isValidExtension) {
      console.error("Upload error: Invalid file type:", file.type, "Extension:", fileExtension);
      return NextResponse.json(
        { success: false, error: "Only image files are allowed (jpg, jpeg, png, gif, webp)" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error("Upload error: File too large:", file.size);
      return NextResponse.json(
        { success: false, error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get target dimensions
    const dimensions = TARGET_DIMENSIONS[imageType] || TARGET_DIMENSIONS.default;

    // Process image with Sharp
    let processedBuffer: Buffer;

    try {
      let pipeline = sharp(buffer);

      // Only resize if NOT logo
      if (imageType !== 'logo') {
        pipeline = pipeline.resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'center',
        });
      }

      // Maintain original format but optimize quality slightly
      if (fileExtension === '.png') {
        processedBuffer = await pipeline.png({ quality: 90 }).toBuffer();
      } else if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
        processedBuffer = await pipeline.jpeg({ quality: 90 }).toBuffer();
      } else if (fileExtension === '.webp') {
        processedBuffer = await pipeline.webp({ quality: 90 }).toBuffer();
      } else if (fileExtension === '.gif') {
        processedBuffer = await pipeline.gif().toBuffer();
      } else {
        // Fallback for other formats
        processedBuffer = await pipeline.toBuffer();
      }

      if (imageType !== 'logo') {
        console.log(`Image processed: ${dimensions.width}x${dimensions.height} ${fileExtension}`);
      } else {
        console.log(`Image processed (no resize): ${fileExtension}`);
      }
    } catch (sharpError) {
      console.error("Sharp processing error:", sharpError);
      // Fallback to original buffer if processing fails
      processedBuffer = buffer;
    }

    // Generate unique filename
    const timestamp = Date.now();
    const shortId = timestamp.toString(36); // Base36 encoding for shorter filenames

    let filename;
    // Use structured naming for known types: {type}-{shortId}{extension}
    if (['course', 'institution', 'news', 'instructor', 'banner', 'banner-square'].includes(imageType)) {
      filename = `${imageType}-${shortId}${fileExtension}`;
    } else {
      // Fallback for other types: {shortId}-{originalName}{extension}
      const baseName = path.basename(file.name, fileExtension).replace(/\s+/g, "-");
      filename = `${shortId}-${baseName}${fileExtension}`;
    }

    // Create organized folder structure
    // Map 'banner-square' to 'banners' folder
    let typeFolder: string;
    if (imageType === 'banner-square') {
      typeFolder = 'banners';
    } else if (imageType === 'news') {
      typeFolder = 'news'; // Keep 'news' as is, don't add 's'
    } else if (['banner', 'course', 'instructor', 'institution', 'square'].includes(imageType)) {
      typeFolder = `${imageType}s`;
    } else {
      typeFolder = 'others';
    }

    // Determine base upload directory using centralized utility
    // This handles PM2/Standalone vs Local dev paths correctly
    const baseUploadDir = getUploadsDir();

    const uploadsDir = path.join(baseUploadDir, typeFolder);

    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Write processed file to uploads directory
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, processedBuffer);

    console.log("File uploaded successfully:", filepath);

    // Return URL with cache-busting timestamp
    const url = `/uploads/${typeFolder}/${filename}?t=${timestamp}`;

    return NextResponse.json({
      success: true,
      url,
      filename,
      dimensions,
      type: imageType,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
