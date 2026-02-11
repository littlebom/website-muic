"use client";

import { useLanguage } from "@/lib/language-context";
import { BookOpen, Mail, Phone, MapPin, Facebook, Twitter, Youtube, Instagram } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { WebAppSettings } from "@/lib/types";

export function Footer() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<WebAppSettings | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
    loadSettings();
  }, []);

  return (
    <footer className="bg-slate-900 mt-auto relative overflow-hidden">
      {/* Subtle Blue Glow Accent - Wide coverage ~90% */}
      <div className="absolute -top-40 right-0 w-[90%] h-[500px] bg-gradient-to-l from-primary/15 via-primary/8 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-20 w-[50%] h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              {settings?.footerLogo ? (
                <div className="relative h-10 w-32">
                  <Image
                    src={settings.footerLogo}
                    alt={settings.siteName || "MUIC"}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : settings?.siteLogo ? (
                <div className="relative h-10 w-32">
                  <Image
                    src={settings.siteLogo}
                    alt={settings.siteName || "MUIC"}
                    fill
                    className="object-contain brightness-0 invert"
                  />
                </div>
              ) : (
                <>
                  <BookOpen className="h-8 w-8 text-primary" />
                  <span className="text-xl font-bold text-white">{settings?.siteName || "MUIC"}</span>
                </>
              )}
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t(
                settings?.aboutUs || "แพลตฟอร์มการเรียนรู้ออนไลน์สำหรับคนไทย",
                settings?.aboutUsEn || "Online Learning Platform for Thai People"
              )}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-[1.1rem] text-white">{t("ลิงก์ด่วน", "Quick Links")}</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Link href="/courses" className="text-slate-400 hover:text-white transition-colors">
                {t("รายวิชาทั้งหมด", "Courses")}
              </Link>
              <Link href="/institutions" className="text-slate-400 hover:text-white transition-colors">
                {t("สถาบันผู้พัฒนา", "Institutions")}
              </Link>
              <Link href="/news" className="text-slate-400 hover:text-white transition-colors">
                {t("ข่าวประชาสัมพันธ์", "News")}
              </Link>
              <Link href="/support" className="text-slate-400 hover:text-white transition-colors">
                {t("คู่มือและบริการ", "Manuals & Services")}
              </Link>
              <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">
                {t("ติดต่อเรา", "Contact")}
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-[1.1rem] text-white">{t("ติดต่อเรา", "Contact Us")}</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-3 hover:text-slate-300 transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span>{settings?.contactEmail || "contact@thaimooc.ac.th"}</span>
              </li>
              <li className="flex items-center gap-3 hover:text-slate-300 transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <span>{settings?.contactPhone || "02-123-4567"}</span>
              </li>
              <li className="flex items-center gap-3 hover:text-slate-300 transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <span>{settings?.address ? t(settings.address, settings.addressEn || settings.address) : t("กรุงเทพมหานคร ประเทศไทย", "Bangkok, Thailand")}</span>
              </li>
            </ul>

            {/* Social Media Icons */}
            {(settings?.facebookUrl || settings?.twitterUrl || settings?.youtubeUrl || settings?.instagramUrl || settings?.lineUrl) && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3 text-sm text-white">{t("ติดตามเรา", "Follow Us")}</h4>
                <div className="flex gap-3">
                  {settings?.facebookUrl && (
                    <a
                      href={settings.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary text-slate-400 hover:text-white transition-all duration-300 flex items-center justify-center"
                      aria-label="Facebook"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {settings?.twitterUrl && (
                    <a
                      href={settings.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary text-slate-400 hover:text-white transition-all duration-300 flex items-center justify-center"
                      aria-label="Twitter"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                  {settings?.youtubeUrl && (
                    <a
                      href={settings.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary text-slate-400 hover:text-white transition-all duration-300 flex items-center justify-center"
                      aria-label="YouTube"
                    >
                      <Youtube className="h-4 w-4" />
                    </a>
                  )}
                  {settings?.instagramUrl && (
                    <a
                      href={settings.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary text-slate-400 hover:text-white transition-all duration-300 flex items-center justify-center"
                      aria-label="Instagram"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {settings?.lineUrl && (
                    <a
                      href={settings.lineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary text-slate-400 hover:text-white transition-all duration-300 flex items-center justify-center"
                      aria-label="LINE"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6">
          <p className="text-center text-sm text-slate-500">
            © 2025 {settings?.siteName || "MUIC"}. {t("สงวนลิขสิทธิ์", "All rights reserved")}.
          </p>
        </div>
      </div>
    </footer>
  );
}
