"use client";

import Image from "next/image";
import { ImageProps } from "next/image";
import { useState, useEffect } from "react";
import { useDefaultImages } from "@/hooks/use-default-images";

// Helper function to check if a string is a valid image URL
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
};

interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
  fallbackType?: 'course' | 'institution' | 'news' | 'instructor';
}

// Wrapper component that safely handles image URLs with fallback support
export function SafeImage({
  src,
  alt,
  fill,
  className,
  priority,
  fallbackType,
  ...props
}: SafeImageProps) {
  const { defaultImages } = useDefaultImages();

  // State to track the current image source being displayed
  // 0: Initial src
  // 1: Default fallback from settings
  // 2: Placehold.co fallback
  const [fallbackLevel, setFallbackLevel] = useState(0);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  // Filter out Next.js Image-specific props for HTML img tag
  const { loading, quality, placeholder, blurDataURL, ...htmlProps } = props as any;

  // Initialize or reset when src changes
  useEffect(() => {
    if (isValidImageUrl(src)) {
      setFallbackLevel(0);
      setCurrentSrc(src as string);
    } else {
      // invalid src immediately goes to level 1
      setFallbackLevel(1);
    }
  }, [src]);

  // Update currentSrc when fallbackLevel or defaultImages changes
  useEffect(() => {
    if (fallbackLevel === 0) {
      if (isValidImageUrl(src)) setCurrentSrc(src as string);
      else setFallbackLevel(1);
    } else if (fallbackLevel === 1) {
      // Level 1: Try default image from settings
      let fallback: string | null = null;
      if (fallbackType === 'course') fallback = defaultImages.defaultCourseThumbnail;
      else if (fallbackType === 'institution') fallback = defaultImages.defaultInstitutionLogo;
      else if (fallbackType === 'news') fallback = defaultImages.defaultNewsImage;
      else if (fallbackType === 'instructor') fallback = defaultImages.defaultInstitutionLogo;

      if (isValidImageUrl(fallback)) {
        setCurrentSrc(fallback);
      } else {
        // If default is invalid, go to next level
        setFallbackLevel(2);
      }
    } else if (fallbackLevel === 2) {
      // Level 2: External placeholder
      const text = fallbackType ? fallbackType.charAt(0).toUpperCase() + fallbackType.slice(1) : (alt || 'Image');
      setCurrentSrc(`https://placehold.co/600x400?text=${encodeURIComponent(text)}`);
    }
  }, [fallbackLevel, defaultImages, fallbackType, src, alt]);

  const handleError = () => {
    setFallbackLevel(prev => {
      if (prev < 2) return prev + 1;
      return prev; // Stop at level 2
    });
  };

  if (!currentSrc) return null; // Should not happen ideally

  const isUploadedImage = currentSrc.startsWith('/uploads/');

  // Use plain <img> tag for uploaded images to avoid Next.js optimization issues
  if (isUploadedImage) {
    if (fill) {
      return (
        <img
          src={currentSrc}
          alt={alt}
          className={`${className || ''} absolute inset-0 w-full h-full object-cover`}
          onError={handleError}
          {...htmlProps}
        />
      );
    }
    return (
      <img
        src={currentSrc}
        alt={alt}
        className={className}
        onError={handleError}
        {...htmlProps}
      />
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill={fill}
      className={className}
      priority={priority}
      onError={handleError}
      unoptimized={fallbackLevel === 2}
      {...props}
    />
  );
}
