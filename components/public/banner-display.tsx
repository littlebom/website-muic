import { useState, useEffect } from "react";
import type { Banner } from "@/lib/types";
import { Particles } from "@/components/ui/particles";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BannerSlide } from "@/components/banner/banner-slide";

interface BannerDisplayProps {
  banners: Banner[];
  language: "th" | "en";
}

export function BannerDisplay({ banners, language }: BannerDisplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeBanners = banners.filter((b) => b.isActive);

  useEffect(() => {
    if (activeBanners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000); // Increased duration to 6s to match slower mood

    return () => clearInterval(timer);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  return (
    <section className="relative h-[600px] overflow-hidden bg-[#7b8f9a]">
      {/* Global Particles (Optional: if we want particles everywhere, or moved inside map for per-slide) 
          Archive/banner.html has particles as an addon. We can place it globally for the section. 
      */}
      {/* Global Particles (Above background images (z-20) but below text content (z-30)) */}
      <Particles
        className="absolute inset-0 z-[25] pointer-events-none"
        quantity={50}
        refresh={false}
      />

      {activeBanners.map((banner, index) => {
        const isActive = index === currentIndex;
        return (
          <BannerSlide
            key={banner.id}
            banner={banner}
            language={language}
            isActive={isActive}
            priority={index === 0}
          />
        );
      })}

      {/* Navigation Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-3 transition-all z-30 backdrop-blur-sm border border-white/20"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-3 transition-all z-30 backdrop-blur-sm border border-white/20"
            aria-label="Next banner"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      {/* Indicators */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-30">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1 transition-all duration-300 ${index === currentIndex
                ? "bg-white w-12"
                : "bg-white/40 w-8 hover:bg-white/60"
                }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
