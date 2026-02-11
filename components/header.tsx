"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/language-context";
import { Button } from "./ui/button";
import { BookOpen, Globe, Blocks, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { WebAppSettings } from "@/lib/types";

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const [settings, setSettings] = useState<WebAppSettings | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <>
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              {settings?.siteLogo ? (
                <div className="relative h-10 w-32">
                  <Image
                    src={settings.siteLogo}
                    alt={settings.siteName || "MUIC"}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <>
                  <BookOpen className="h-8 w-8 text-primary" />
                  <span className="text-xl font-bold">{settings?.siteName || "MUIC"}</span>
                </>
              )}
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="text-[1rem] font-medium hover:text-primary transition-colors"
              >
                {t("หน้าหลัก", "Home")}
              </Link>
              <Link
                href="/courses"
                className="text-[1rem] font-medium hover:text-primary transition-colors"
              >
                {t("รายวิชาทั้งหมด", "Courses")}
              </Link>
              <Link
                href="/institutions"
                className="text-[1rem] font-medium hover:text-primary transition-colors"
              >
                {t("สถาบันผู้พัฒนา", "Institutions")}
              </Link>
              <Link
                href="/news"
                className="text-[1rem] font-medium hover:text-primary transition-colors"
              >
                {t("ข่าวประชาสัมพันธ์", "News")}
              </Link>
              <Link
                href="/support"
                className="text-[1rem] font-medium hover:text-primary transition-colors"
              >
                {t("คู่มือและบริการ", "Manuals & Services")}
              </Link>
              <Link
                href="/contact"
                className="text-[1rem] font-medium hover:text-primary transition-colors"
              >
                {t("ติดต่อเรา", "Contact")}
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === "th" ? "en" : "th")}
                className="flex items-center gap-2"
                style={{ borderRadius: '5px' }}
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{language === "th" ? "EN" : "TH"}</span>
              </Button>

              <Button
                asChild
                variant="default"
                size="sm"
                className="hidden sm:flex items-center gap-2"
                style={{ borderRadius: '5px' }}
              >
                <Link href={settings?.classroomUrl || "https://learn.thaimooc.ac.th/dashboard"} target="_blank" rel="noopener noreferrer">
                  <Blocks className="h-4 w-4" />
                  {t("เข้าห้องเรียน", "My Classroom")}
                </Link>
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
                aria-label={t("เปิดเมนู", "Open menu")}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Sidebar */}
      <div
        id="mobile-menu"
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-[70] transform transition-transform duration-300 ease-in-out md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        role="dialog"
        aria-modal="true"
        aria-label={t("เมนูหลัก", "Main Menu")}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              {settings?.siteLogo ? (
                <div className="relative h-8 w-24">
                  <Image
                    src={settings.siteLogo}
                    alt={settings.siteName || "MUIC"}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <>
                  <BookOpen className="h-6 w-6 text-primary" />
                  <span className="font-bold text-sm">{settings?.siteName || "MUIC"}</span>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
              aria-label={t("ปิดเมนู", "Close menu")}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="flex flex-col space-y-1">
              <Link
                href="/"
                className="text-[1rem] font-medium hover:bg-gray-100 hover:text-primary transition-colors px-4 py-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("หน้าหลัก", "Home")}
              </Link>
              <Link
                href="/courses"
                className="text-[1rem] font-medium hover:bg-gray-100 hover:text-primary transition-colors px-4 py-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("รายวิชาทั้งหมด", "Courses")}
              </Link>
              <Link
                href="/institutions"
                className="text-[1rem] font-medium hover:bg-gray-100 hover:text-primary transition-colors px-4 py-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("สถาบันผู้พัฒนา", "Institutions")}
              </Link>
              <Link
                href="/news"
                className="text-[1rem] font-medium hover:bg-gray-100 hover:text-primary transition-colors px-4 py-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("ข่าวประชาสัมพันธ์", "News")}
              </Link>
              <Link
                href="/support"
                className="text-[1rem] font-medium hover:bg-gray-100 hover:text-primary transition-colors px-4 py-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("คู่มือและบริการ", "Manuals & Services")}
              </Link>
              <Link
                href="/contact"
                className="text-[1rem] font-medium hover:bg-gray-100 hover:text-primary transition-colors px-4 py-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("ติดต่อเรา", "Contact")}
              </Link>
            </div>
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t space-y-3">
            <Button
              asChild
              variant="default"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
              style={{ borderRadius: '5px' }}
            >
              <Link href={settings?.classroomUrl || "https://learn.thaimooc.ac.th/dashboard"} target="_blank" rel="noopener noreferrer">
                <Blocks className="h-4 w-4" />
                {t("เข้าห้องเรียน", "My Classroom")}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLanguage(language === "th" ? "en" : "th");
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2"
              style={{ borderRadius: '5px' }}
            >
              <Globe className="h-4 w-4" />
              {t("เปลี่ยนเป็นภาษาอังกฤษ", "Switch to Thai")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
