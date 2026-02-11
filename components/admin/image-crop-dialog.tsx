"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getCroppedImg, ASPECT_RATIOS, TARGET_DIMENSIONS, ImageType } from "@/lib/image-utils";
import { Loader2, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ImageCropDialogProps {
    open: boolean;
    onClose: () => void;
    imageSrc: string;
    imageType: ImageType;
    onCropComplete: (croppedFile: File) => void;
    originalFileName: string;
    originalFile?: File;
}

export function ImageCropDialog({
    open,
    onClose,
    imageSrc,
    imageType,
    onCropComplete,
    originalFileName,
    originalFile,
}: ImageCropDialogProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const aspectRatio = ASPECT_RATIOS[imageType];
    const targetDimensions = TARGET_DIMENSIONS[imageType];
    const isFreeCrop = aspectRatio === 0;

    const onCropChange = useCallback((crop: any) => {
        setCrop(crop);
    }, []);

    const onZoomChange = useCallback((zoom: number) => {
        setZoom(zoom);
    }, []);

    const onRotationChange = useCallback((rotation: number) => {
        setRotation(rotation);
    }, []);

    const onCropCompleteCallback = useCallback(
        (croppedArea: any, croppedAreaPixels: any) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const handleCropConfirm = async () => {
        try {
            setIsProcessing(true);

            if (!croppedAreaPixels) {
                throw new Error("No crop area selected");
            }

            // Determine MIME type based on original filename
            const isPng = originalFileName.toLowerCase().endsWith('.png');
            const mimeType = isPng ? 'image/png' : 'image/jpeg';

            // Get cropped image as blob
            const croppedBlob = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                rotation,
                { horizontal: false, vertical: false },
                mimeType
            );

            // Convert blob to file
            const croppedFile = new File([croppedBlob], originalFileName, {
                type: mimeType,
            });

            onCropComplete(croppedFile);
            onClose();
        } catch (error) {
            console.error("Error cropping image:", error);
            alert("Failed to crop image. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const resetCrop = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Crop Image - {imageType.charAt(0).toUpperCase() + imageType.slice(1)}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {isFreeCrop
                            ? "Free aspect ratio (adjust as needed)"
                            : `Target size: ${targetDimensions.width}x${targetDimensions.height} (Aspect ratio: ${aspectRatio.toFixed(2)})`
                        }
                    </p>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Crop Area */}
                    <div className="relative w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={isFreeCrop ? undefined : aspectRatio}
                            onCropChange={onCropChange}
                            onZoomChange={onZoomChange}
                            onRotationChange={onRotationChange}
                            onCropComplete={onCropCompleteCallback}
                            objectFit="contain"
                        />
                    </div>

                    {/* Controls */}
                    <div className="space-y-4">
                        {/* Zoom Control */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <ZoomIn className="h-4 w-4" />
                                    Zoom
                                </label>
                                <span className="text-sm text-muted-foreground">{zoom.toFixed(1)}x</span>
                            </div>
                            <Slider
                                value={[zoom]}
                                onValueChange={(value) => setZoom(value[0])}
                                min={1}
                                max={3}
                                step={0.1}
                                className="w-full"
                            />
                        </div>

                        {/* Rotation Control */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <RotateCw className="h-4 w-4" />
                                    Rotation
                                </label>
                                <span className="text-sm text-muted-foreground">{rotation}°</span>
                            </div>
                            <Slider
                                value={[rotation]}
                                onValueChange={(value) => setRotation(value[0])}
                                min={0}
                                max={360}
                                step={1}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={resetCrop} disabled={isProcessing}>
                        Reset
                    </Button>
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                        Cancel
                    </Button>
                    {originalFile && (
                        <Button variant="secondary" onClick={() => {
                            onCropComplete(originalFile);
                            onClose();
                        }} disabled={isProcessing}>
                            Skip Cropping
                        </Button>
                    )}
                    <Button onClick={handleCropConfirm} disabled={isProcessing}>
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Crop & Upload"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
