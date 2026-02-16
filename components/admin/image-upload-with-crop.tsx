"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ImageCropDialog } from "./image-crop-dialog";
import { readFile, ImageType } from "@/lib/image-utils";
import { Upload, Loader2, X } from "lucide-react";
import { SafeImage } from "@/components/safe-image";

interface ImageUploadWithCropProps {
    imageType: ImageType;
    currentImageUrl?: string;
    onImageUploaded: (url: string) => void;
    onImageRemoved?: () => void;
    label?: string;
    className?: string;
    disableCrop?: boolean;
    showPreview?: boolean;
    uploadId?: string; // Unique identifier for input element to avoid conflicts
}

export function ImageUploadWithCrop({
    imageType,
    currentImageUrl,
    onImageUploaded,
    onImageRemoved,
    label,
    className = "",
    disableCrop = false,
    showPreview = true,
    uploadId,
}: ImageUploadWithCropProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imageSrc, setImageSrc] = useState<string>("");
    const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl || "");

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file");
            return;
        }

        // Validate file size (50MB)
        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            alert(`ไฟล์มีขนาดใหญ่เกินไป (${(file.size / 1024 / 1024).toFixed(2)}MB) ระบบรองรับขนาดไฟล์สูงสุด 50MB ครับ`);
            return;
        }

        if (disableCrop) {
            // If cropping is disabled, upload directly
            await handleCropComplete(file);
        } else {
            try {
                // Read file as data URL for preview
                const dataUrl = await readFile(file);
                setImageSrc(dataUrl);
                setSelectedFile(file);
                setCropDialogOpen(true);
            } catch (error) {
                console.error("Error reading file:", error);
                alert("Failed to read file");
            }
        }

        // Reset input
        e.target.value = "";
    };

    const handleCropComplete = async (croppedFile: File) => {
        try {
            setIsUploading(true);

            // Create form data
            const formData = new FormData();
            formData.append("file", croppedFile);
            formData.append("imageType", imageType);

            // Upload to server
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Upload failed");
            }

            // Update preview
            setPreviewUrl(data.url);
            onImageUploaded(data.url);

            console.log("Image uploaded successfully:", data);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setIsUploading(false);
            setCropDialogOpen(false);
        }
    };

    const handleRemoveImage = () => {
        setPreviewUrl("");
        if (onImageRemoved) {
            onImageRemoved();
        }
    };

    // Sync previewUrl with currentImageUrl prop
    useEffect(() => {
        if (currentImageUrl && currentImageUrl !== previewUrl) {
            console.log('[ImageUploadWithCrop] Updating preview URL:', currentImageUrl);
            setPreviewUrl(currentImageUrl);
        }
    }, [currentImageUrl]);

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium mb-2">{label}</label>
            )}

            <div className="space-y-4">
                {/* Preview */}
                {showPreview && previewUrl && (
                    <div className="relative w-full max-w-md border rounded-lg overflow-hidden bg-gray-50">
                        <SafeImage
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-auto"
                            width={800}
                            height={450}
                        />
                        {onImageRemoved && (
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                title="Remove image"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}

                {/* Upload Button */}
                <div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id={`image-upload-${uploadId || imageType}`}
                        disabled={isUploading}
                    />
                    <label htmlFor={`image-upload-${uploadId || imageType}`}>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isUploading}
                            asChild
                        >
                            <span className="cursor-pointer">
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        {previewUrl ? "Change Image" : "Upload Image"}
                                    </>
                                )}
                            </span>
                        </Button>
                    </label>
                </div>
            </div>

            {/* Crop Dialog */}
            {selectedFile && (
                <ImageCropDialog
                    open={cropDialogOpen}
                    onClose={() => setCropDialogOpen(false)}
                    imageSrc={imageSrc}
                    imageType={imageType}
                    onCropComplete={handleCropComplete}
                    originalFileName={selectedFile.name}
                    originalFile={selectedFile}
                />
            )}
        </div>
    );
}
