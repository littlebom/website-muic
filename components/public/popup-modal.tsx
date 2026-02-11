"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Popup } from "@/lib/types";
import { getImageUrl } from "@/lib/utils";

interface PopupModalProps {
  language: "th" | "en";
}

export function PopupModal({ language }: PopupModalProps) {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    async function fetchPopup() {
      try {
        const response = await fetch("/api/popups?active=true");
        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
          const popups = data.data.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
            startDate: p.startDate ? new Date(p.startDate) : null,
            endDate: p.endDate ? new Date(p.endDate) : null,
          }));

          // Filter popups by date range
          const now = new Date();
          const validPopups = popups.filter((p: Popup) => {
            const startValid = !p.startDate || new Date(p.startDate) <= now;
            const endValid = !p.endDate || new Date(p.endDate) >= now;
            return startValid && endValid;
          });

          if (validPopups.length > 0) {
            const selectedPopup = validPopups[0]; // Get first popup

            // Check if popup should show once
            if (selectedPopup.showOnce) {
              const cookieName = `popup_seen_${selectedPopup.id}`;
              const hasSeen = document.cookie.includes(cookieName);
              if (hasSeen) {
                return; // Don't show if already seen
              }
            }

            setPopup(selectedPopup);
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch popup:", error);
      }
    }

    // Delay popup display by 1 second
    const timer = setTimeout(() => {
      fetchPopup();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    if (popup && popup.showOnce) {
      // Set cookie to remember user has seen this popup
      const cookieName = `popup_seen_${popup.id}`;
      // Set cookie for 30 days
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      document.cookie = `${cookieName}=true; expires=${expires.toUTCString()}; path=/`;
    }
    setIsVisible(false);
  };

  if (!isVisible || !popup) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>

        {/* Popup Image */}
        <div className="relative w-full">
          <img
            src={getImageUrl(popup.imageId)}
            alt={language === "th" ? popup.title : popup.titleEn}
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        </div>

        {/* Popup Content - Only show if there's a button */}
        {popup.linkUrl && (popup.buttonText || popup.buttonTextEn) && (
          <div className="p-6">
            {/* Action Button */}
            <Button asChild className="w-full">
              <Link
                href={popup.linkUrl}
                onClick={handleClose}
              >
                {language === "th"
                  ? (popup.buttonText || "เรียนรู้เพิ่มเติม")
                  : (popup.buttonTextEn || "Learn More")}
              </Link>
            </Button>

            {/* Close link */}
            <button
              onClick={handleClose}
              className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {language === "th" ? "ปิด" : "Close"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
