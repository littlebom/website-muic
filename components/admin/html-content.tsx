
"use client";

import DOMPurify from "isomorphic-dompurify";
import parse, { DOMNode, Element } from "html-react-parser";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { useState } from "react";
import { Maximize2 } from "lucide-react";

interface HtmlContentProps {
    content: string;
    className?: string;
}

export function HtmlContent({ content, className = "" }: HtmlContentProps) {
    // Sanitize first to prevent XSS
    const sanitizedContent = DOMPurify.sanitize(content);

    // Custom replacements
    const options = {
        replace: (domNode: DOMNode) => {
            if (domNode instanceof Element && domNode.name === "img") {
                const { src, alt, style, ...attribs } = domNode.attribs;

                return (
                    <Dialog>
                        <DialogTrigger asChild>
                            <span className="relative inline-block group cursor-zoom-in my-2">
                                <img
                                    src={src}
                                    alt={alt || "Image"}
                                    className="max-w-[200px] h-auto rounded border hover:opacity-90 transition-opacity"
                                    {...attribs}
                                />
                                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity rounded">
                                    <Maximize2 className="w-6 h-6 text-white drop-shadow-md" />
                                </span >
                            </span >
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                            <DialogTitle className="sr-only">Image Preview</DialogTitle>
                            <div className="relative w-full h-[80vh] flex items-center justify-center">
                                <img
                                    src={src}
                                    alt={alt || "Full size image"}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                );
            }
        },
    };

    return (
        <div className={`prose max-w-none ${className}`}>
            {parse(sanitizedContent, options)}
        </div>
    );
}
