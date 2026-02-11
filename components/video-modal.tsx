"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface VideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string | null;
    title?: string;
}

export function VideoModal({ isOpen, onClose, videoUrl, title }: VideoModalProps) {
    if (!videoUrl) return null;

    // Helper to determine if it's a YouTube URL and convert to embed format if needed
    const getEmbedUrl = (url: string) => {
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            let videoId = "";
            if (url.includes("youtube.com/watch?v=")) {
                videoId = url.split("v=")[1].split("&")[0];
            } else if (url.includes("youtu.be/")) {
                videoId = url.split("youtu.be/")[1];
            } else if (url.includes("youtube.com/embed/")) {
                return url; // Already an embed URL
            }
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            }
        }
        return url;
    };

    const finalUrl = getEmbedUrl(videoUrl);
    const isVideoFile = finalUrl.match(/\.(mp4|webm|ogg)$/i);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-black border-none">
                <DialogHeader className="sr-only">
                    <DialogTitle>{title || "Video Player"}</DialogTitle>
                </DialogHeader>

                <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                    {/* Close button overlay (optional if Dialog has its own) */}

                    {isVideoFile ? (
                        <video
                            src={finalUrl}
                            controls
                            autoPlay
                            className="w-full h-full"
                        >
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        <iframe
                            src={finalUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
