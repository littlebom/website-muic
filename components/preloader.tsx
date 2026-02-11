"use client";

import { useEffect, useState } from "react";

interface PreloaderSettings {
  enabled: boolean;
  title: string;
  subtitle: string;
  primaryColor: string;
  backgroundColor: string;
}

export function Preloader() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [settings, setSettings] = useState<PreloaderSettings>({
    enabled: true,
    title: "MUIC",
    subtitle: "แพลตฟอร์มการเรียนรู้ออนไลน์",
    primaryColor: "#2563eb",
    backgroundColor: "#ffffff",
  });

  useEffect(() => {
    // Fetch preloader settings
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();
        setSettings({
          enabled: data.preloaderEnabled ?? true,
          title: data.preloaderTitle || "MUIC",
          subtitle: data.preloaderSubtitle || "แพลตฟอร์มการเรียนรู้ออนไลน์",
          primaryColor: data.preloaderPrimaryColor || "#2563eb",
          backgroundColor: data.preloaderBackgroundColor || "#ffffff",
        });
      } catch (error) {
        console.error("Failed to load preloader settings:", error);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    // If preloader is disabled, don't show it
    if (!settings.enabled) {
      setLoading(false);
      return;
    }

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setLoading(false), 300);
          return 100;
        }
        // Randomize progress increment for more realistic effect
        const increment = Math.random() * 15 + 5;
        return Math.min(prev + increment, 100);
      });
    }, 150);

    // Also check if page is actually loaded
    const handleLoad = () => {
      setProgress(100);
      setTimeout(() => setLoading(false), 300);
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener("load", handleLoad);
    };
  }, [settings.enabled]);

  if (!loading || !settings.enabled) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ backgroundColor: settings.backgroundColor }}
    >
      {/* Logo or Brand */}
      <div className="mb-8 text-center">
        <h1
          className="text-4xl font-bold mb-2"
          style={{ color: settings.primaryColor }}
        >
          {settings.title}
        </h1>
        <p
          className="text-base"
          style={{ color: settings.primaryColor, opacity: 0.7 }}
        >
          {settings.subtitle}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-80 max-w-[90%]">
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(to right, ${settings.primaryColor}, ${settings.primaryColor})`
            }}
          >
            <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
          </div>
        </div>

        {/* Percentage Display */}
        <div className="mt-4 text-center">
          <span
            className="text-2xl font-semibold"
            style={{ color: settings.primaryColor }}
          >
            {Math.round(progress)}%
          </span>
          <p
            className="text-sm mt-1"
            style={{ color: settings.primaryColor, opacity: 0.6 }}
          >
            กำลังโหลด...
          </p>
        </div>
      </div>

      {/* Animated Dots */}
      <div className="flex gap-2 mt-8">
        <div
          className="w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s]"
          style={{ backgroundColor: settings.primaryColor }}
        ></div>
        <div
          className="w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s]"
          style={{ backgroundColor: settings.primaryColor }}
        ></div>
        <div
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ backgroundColor: settings.primaryColor }}
        ></div>
      </div>
    </div>
  );
}
