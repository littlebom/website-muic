"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/safe-image";
import { ArrowRight } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import type { Banner } from "@/lib/types";
import { HomeSearchBox } from "@/components/public/home-search-box";

interface BannerSlideProps {
    banner: Partial<Banner>;
    language: "th" | "en";
    isActive: boolean;
    priority?: boolean;
    disableForm?: boolean;
}

export function BannerSlide({ banner, language, isActive, priority = false, disableForm = false }: BannerSlideProps) {
    // Split layout check - default to true as per new requirement if templateId is missing or strictly "hero-split"
    const isSplit = banner.templateId === "hero-split" || !banner.templateId;

    return (
        <div
            className={`absolute inset-0 transition-all duration-1000 ${isActive ? "opacity-100 visible z-20" : "opacity-0 invisible z-10"
                }`}
            style={{
                background: banner.backgroundColor || "transparent",
            }}
        >
            {/* Background Image with Kenburns and Overlay */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Background Layer */}
                {banner.backgroundImageId || banner.imageId ? (
                    <div className={`relative w-full h-full ${isActive ? 'animate-kenburns' : ''}`}>
                        {/* 
                For Admin Preview flexibility, we might want to handle raw URLs if they are passed 
                (though SafeImage + getImageUrl usually handles IDs). 
                If banner.backgroundImageId is a full URL (blob/data), getImageUrl might need to handle it or we check here.
                Assuming getImageUrl handles IDs and we might pass raw URLs from preview.
             */}
                        <SafeImage
                            src={banner.backgroundImageId?.startsWith("http") || banner.backgroundImageId?.startsWith("blob")
                                ? banner.backgroundImageId
                                : getImageUrl(banner.backgroundImageId || banner.imageId)}
                            alt="Background"
                            fill
                            className="object-cover object-center"
                            priority={priority}
                        />
                    </div>
                ) : null}

                {/* Dotted Overlay */}
                <div className="dotted-overlay" />
                {/* Fallback Dark Overlay with Dynamic Opacity */}
                <div
                    className="absolute inset-0 z-[3]"
                    style={{ backgroundColor: `rgba(15, 23, 42, ${banner.overlayOpacity ? banner.overlayOpacity / 100 : 0.4})` }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-30 h-full container mx-auto px-4 h-full">
                {isSplit ? (
                    /* Split Layout: Text Left, Image Right */
                    <div className="grid md:grid-cols-2 gap-0 h-full items-center">
                        {/* Left: Content */}
                        <div className="flex flex-col justify-center h-full px-4 text-left">
                            {/* Title */}
                            <div className={`overflow-hidden mb-2 md:mb-4`}>
                                <h1
                                    className={`text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-widest uppercase transition-all duration-1000 transform ${isActive ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                                        }`}
                                    style={{
                                        color: banner.textColor || "#ffffff",
                                        textShadow: "0 2px 10px rgba(0,0,0,0.3)"
                                    }}
                                >
                                    {language === "th" ? banner.title : banner.titleEn}
                                </h1>
                            </div>

                            {/* Subtitle / Description */}
                            {(banner.subtitle || banner.subtitleEn) && (
                                <div className="overflow-hidden mb-6 md:mb-8">
                                    <p
                                        className={`text-xl md:text-3xl font-light tracking-widest uppercase transition-all duration-1000 delay-300 transform ${isActive ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                                            }`}
                                        style={{ color: banner.textColor || "#ffffff" }}
                                    >
                                        {language === "th" ? banner.subtitle : banner.subtitleEn}
                                    </p>
                                </div>
                            )}

                            {/* Search Box */}
                            {(banner.showSearchBox !== false) && (
                                <div className={`transition-all duration-1000 delay-400 transform mb-4 md:mb-6 ${isActive ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                                    }`}>
                                    <HomeSearchBox variant="banner" className="mx-0" disableForm={disableForm} />
                                </div>
                            )}

                            {/* Buttons */}
                            {banner.linkUrl && (
                                <div className={`transition-all duration-1000 delay-500 transform ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                                    }`}>
                                    <Button
                                        asChild
                                        size="lg"
                                        className="text-md font-bold uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 inline-flex"
                                        style={{
                                            backgroundColor: "#ffffff",
                                            color: "#000000",
                                            borderRadius: "5px",
                                            padding: "25px 40px",
                                            border: "none"
                                        }}
                                    >
                                        <Link
                                            href={banner.linkUrl}
                                            target={banner.linkTarget || "_self"}
                                            className="flex items-center gap-2"
                                        >
                                            {language === "th"
                                                ? (banner.buttonText || "ลงทะเบียนเรียน")
                                                : (banner.buttonTextEn || "Registration")}
                                            <ArrowRight className="h-5 w-5" />
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Right: Image */}
                        {banner.imageId && (
                            <div className={`relative h-full hidden md:block transition-all duration-1000 delay-200 ${isActive ? "opacity-100" : "opacity-0"
                                }`}>
                                <SafeImage
                                    src={banner.imageId.startsWith("http") || banner.imageId.startsWith("blob")
                                        ? banner.imageId
                                        : getImageUrl(banner.imageId)}
                                    alt="Banner Image"
                                    fill
                                    className="object-cover object-center"
                                    priority={priority}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    /* Centered Layout (Fallback) */
                    <div className="flex flex-col justify-center h-full max-w-4xl mx-auto text-center">

                        {/* Title */}
                        <div className={`overflow-hidden mb-2 md:mb-4`}>
                            <h1
                                className={`text-5xl md:text-7xl font-extrabold tracking-widest uppercase transition-all duration-1000 transform ${isActive ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                                    }`}
                                style={{
                                    color: banner.textColor || "#ffffff",
                                    textShadow: "0 2px 10px rgba(0,0,0,0.3)"
                                }}
                            >
                                {language === "th" ? banner.title : banner.titleEn}
                            </h1>
                        </div>

                        {/* Subtitle / Description */}
                        {(banner.subtitle || banner.subtitleEn) && (
                            <div className="overflow-hidden mb-6 md:mb-8">
                                <p
                                    className={`text-2xl md:text-4xl font-light tracking-widest uppercase transition-all duration-1000 delay-300 transform ${isActive ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                                        }`}
                                    style={{ color: banner.textColor || "#ffffff" }}
                                >
                                    {language === "th" ? banner.subtitle : banner.subtitleEn}
                                </p>
                            </div>
                        )}

                        {/* Search Box */}
                        {(banner.showSearchBox !== false) && (
                            <div className={`transition-all duration-1000 delay-400 transform mb-4 md:mb-6 ${isActive ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                                }`}>
                                <HomeSearchBox variant="banner" className="mx-auto" disableForm={disableForm} />
                            </div>
                        )}

                        {/* Buttons */}
                        {banner.linkUrl && (
                            <div className={`transition-all duration-1000 delay-500 transform ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                                }`}>
                                <Button
                                    asChild
                                    size="lg"
                                    className="text-md font-bold uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                                    style={{
                                        backgroundColor: "#ffffff",
                                        color: "#000000",
                                        borderRadius: "5px",
                                        padding: "25px 40px",
                                        border: "none"
                                    }}
                                >
                                    <Link
                                        href={banner.linkUrl}
                                        target={banner.linkTarget || "_self"}
                                        className="flex items-center gap-2"
                                    >
                                        {language === "th"
                                            ? (banner.buttonText || "ลงทะเบียนเรียน")
                                            : (banner.buttonTextEn || "Registration")}
                                        <ArrowRight className="h-5 w-5" />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
