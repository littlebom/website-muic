import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getImagePlaceholder } from "./data";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date, language: "th" | "en"): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const locale = language === "th" ? "th-TH" : "en-US";
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getImageUrl(imageId: string | null | undefined): string {
  // If no imageId, return placeholder
  if (!imageId) {
    return "/placeholder.png";
  }

  // If imageId is already a URL (starts with http:// or https:// or /), return it directly
  if (imageId.startsWith('http://') || imageId.startsWith('https://') || imageId.startsWith('/')) {
    return imageId;
  }

  // Otherwise, try to get URL from ImagePlaceholder
  const placeholder = getImagePlaceholder(imageId);
  return placeholder?.url || "/placeholder.png";
}
