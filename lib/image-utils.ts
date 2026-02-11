/**
 * Image Utilities for Cropping and Processing
 * Handles client-side image cropping and canvas operations
 */

export interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ImageDimensions {
    width: number;
    height: number;
    aspectRatio: number;
}

/**
 * Aspect ratios for different image types
 */
export const ASPECT_RATIOS = {
    banner: 4 / 1,      // 1940x500
    'banner-square': 1 / 1,  // 800x800 (for banner hero-split right side)
    course: 16 / 9,     // 900x502
    instructor: 1 / 1,  // 400x400
    news: 16 / 9,       // 900x502
    institution: 1 / 1, // 400x400
    square: 1 / 1,       // 800x800 (General purpose square)
    logo: 0,            // 0 means free aspect ratio
} as const;

/**
 * Target dimensions for different image types
 */
export const TARGET_DIMENSIONS = {
    banner: { width: 1940, height: 485 },
    'banner-square': { width: 800, height: 800 },
    course: { width: 900, height: 506 },
    instructor: { width: 400, height: 400 },
    news: { width: 900, height: 506 },
    institution: { width: 400, height: 400 },
    square: { width: 800, height: 800 },
    logo: { width: 0, height: 0 }, // 0 means keep original or free
    default: { width: 800, height: 600 },
} as const;

export type ImageType = keyof typeof ASPECT_RATIOS;

/**
 * Create an image element from a URL
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

/**
 * Get radians from degrees
 */
export function getRadianAngle(degreeValue: number): number {
    return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle
 */
export function rotateSize(width: number, height: number, rotation: number) {
    const rotRad = getRadianAngle(rotation);

    return {
        width:
            Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height:
            Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
}

/**
 * Get cropped image as a Blob
 */
export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: CropArea,
    rotation = 0,
    flip = { horizontal: false, vertical: false },
    mimeType = 'image/jpeg'
): Promise<Blob> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    const rotRad = getRadianAngle(rotation);

    // Calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    );

    // Set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // Translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    // Draw rotated image
    ctx.drawImage(image, 0, 0);

    // Create data from the rotated image
    const data = ctx.getImageData(
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height
    );

    // Set canvas width to final desired crop size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Paste generated rotate image at the top left corner
    ctx.putImageData(data, 0, 0);

    // Return as blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Canvas is empty'));
            }
        }, mimeType, 0.95);
    });
}

/**
 * Convert blob to File object
 */
export function blobToFile(blob: Blob, fileName: string): File {
    return new File([blob], fileName, { type: blob.type });
}

/**
 * Read file as data URL
 */
export function readFile(file: File): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(reader.result as string), false);
        reader.readAsDataURL(file);
    });
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(file: File): Promise<ImageDimensions> {
    const url = await readFile(file);
    const img = await createImage(url);

    return {
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height,
    };
}
