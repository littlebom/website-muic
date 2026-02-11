"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BannerSlide } from "@/components/banner/banner-slide";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { ImageUploadWithCrop } from "@/components/admin/image-upload-with-crop";
import type { Banner } from "@/lib/types";

interface BannerFormProps {
  banner?: Banner;
  language: "th" | "en";
}

export function BannerForm({ banner, language }: BannerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Preview scaling logic
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.offsetWidth;
        // Simulate standard desktop width (e.g., 1440px or 1280px)
        // Using 1280px as a reasonable baseline for "website view"
        const targetWidth = 1280;
        const scale = Math.min(containerWidth / targetWidth, 1);
        setPreviewScale(scale);
      }
    };

    window.addEventListener("resize", updateScale);
    updateScale();

    // Small delay to ensure container is fully rendered
    setTimeout(updateScale, 100);

    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const [formData, setFormData] = useState({
    title: banner?.title || "",
    titleEn: banner?.titleEn || "",
    subtitle: banner?.subtitle || "",
    subtitleEn: banner?.subtitleEn || "",
    description: banner?.description || "",
    descriptionEn: banner?.descriptionEn || "",
    buttonText: banner?.buttonText || "",
    buttonTextEn: banner?.buttonTextEn || "",
    imageId: banner?.imageId || "",
    backgroundImageId: banner?.backgroundImageId || "",
    linkUrl: banner?.linkUrl || "",
    backgroundColor: banner?.backgroundColor || "#667eea",
    textColor: banner?.textColor || "#ffffff",
    accentColor: banner?.accentColor || "#fbbf24",
    templateId: banner?.templateId || "hero-split",
    showSearchBox: banner?.showSearchBox ?? true,
    overlayOpacity: banner?.overlayOpacity ?? 40,
    linkTarget: banner?.linkTarget || "_self",
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = banner ? `/api/banners/${banner.id}` : "/api/banners";
      const method = banner ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          isActive: true,
          order: 0,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to save banner";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      router.push("/admin/banners");
      router.refresh();
    } catch (error) {
      console.error("Error saving banner:", error);
      alert(`Failed to save banner: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {banner
              ? language === "th" ? "แก้ไข Banner" : "Edit Banner"
              : language === "th" ? "สร้าง Banner" : "Create Banner"}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/banners">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === "th" ? "กลับ" : "Back"}
            </Link>
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading
              ? language === "th" ? "กำลังบันทึก..." : "Saving..."
              : language === "th" ? "บันทึก" : "Save"}
          </Button>
        </div>
      </div>



      {/* Preview */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 bg-gray-100" ref={previewContainerRef}>
          <div
            style={{
              width: 1280, // Match targetWidth above
              height: 500,
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
              marginBottom: -(500 * (1 - previewScale))
            }}
          >
            <section className="relative h-full overflow-hidden shadow-lg">
              <BannerSlide
                banner={formData}
                language={language}
                isActive={true}
                disableForm={true}
              />
            </section>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "th" ? "ข้อมูลพื้นฐาน" : "Basic Information"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">{language === "th" ? "หัวข้อ (ไทย)" : "Title (Thai)"} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="titleEn">{language === "th" ? "หัวข้อ (อังกฤษ)" : "Title (English)"} *</Label>
              <Input
                id="titleEn"
                value={formData.titleEn}
                onChange={(e) => handleChange("titleEn", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subtitle">{language === "th" ? "หัวข้อรอง (ไทย)" : "Subtitle (Thai)"}</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => handleChange("subtitle", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitleEn">{language === "th" ? "หัวข้อรอง (อังกฤษ)" : "Subtitle (English)"}</Label>
              <Input
                id="subtitleEn"
                value={formData.subtitleEn}
                onChange={(e) => handleChange("subtitleEn", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">{language === "th" ? "รายละเอียด (ไทย)" : "Description (Thai)"}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descriptionEn">{language === "th" ? "รายละเอียด (อังกฤษ)" : "Description (English)"}</Label>
              <Textarea
                id="descriptionEn"
                value={formData.descriptionEn}
                onChange={(e) => handleChange("descriptionEn", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <ImageUploadWithCrop
              imageType="banner-square"
              label={language === "th" ? "รูปภาพด้านขวา" : "Right Side Image"}
              currentImageUrl={formData.imageId}
              onImageUploaded={(url) => handleChange("imageId", url)}
              onImageRemoved={() => handleChange("imageId", "")}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {language === "th"
                ? "รูปภาพจะแสดงด้านขวาของ Banner (แนะนำขนาด 800x800 px)"
                : "Image will be displayed on the right side of the banner (Recommended size 800x800 px)"}
            </p>
          </div>

          <div className="space-y-2 border-t pt-4">
            <ImageUploadWithCrop
              imageType="banner"
              label={language === "th" ? "รูปภาพพื้นหลัง (ตัวเลือก)" : "Background Image (Optional)"}
              currentImageUrl={formData.backgroundImageId}
              onImageUploaded={(url) => handleChange("backgroundImageId", url)}
              onImageRemoved={() => handleChange("backgroundImageId", "")}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {language === "th"
                ? "รูปภาพพื้นหลังจะแสดงข้างหลังข้อความและรูปภาพด้านขวา (แนะนำขนาด 1940x485 px)"
                : "Background image will be displayed behind text and right image (Recommended size 1940x485 px)"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Button Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "th" ? "การตั้งค่าปุ่ม" : "Button Settings"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buttonText">{language === "th" ? "ข้อความปุ่ม (ไทย)" : "Button Text (Thai)"}</Label>
              <Input
                id="buttonText"
                value={formData.buttonText}
                onChange={(e) => handleChange("buttonText", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonTextEn">{language === "th" ? "ข้อความปุ่ม (อังกฤษ)" : "Button Text (English)"}</Label>
              <Input
                id="buttonTextEn"
                value={formData.buttonTextEn}
                onChange={(e) => handleChange("buttonTextEn", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkUrl">{language === "th" ? "ลิงก์ปุ่ม" : "Button Link"}</Label>
            <div className="flex gap-2">
              <Input
                id="linkUrl"
                value={formData.linkUrl}
                onChange={(e) => handleChange("linkUrl", e.target.value)}
                placeholder="https://example.com"
                className="flex-1"
              />
              <select
                value={formData.linkTarget}
                onChange={(e) => handleChange("linkTarget", e.target.value)}
                className="w-32 border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="_self">{language === "th" ? "หน้าเดิม" : "Same Tab"}</option>
                <option value="_blank">{language === "th" ? "หน้าใหม่" : "New Tab"}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="showSearchBox">{language === "th" ? "แสดงกล่องค้นหา" : "Show Search Box"}</Label>
                <input
                  type="checkbox"
                  id="showSearchBox"
                  checked={formData.showSearchBox}
                  onChange={(e) => setFormData({ ...formData, showSearchBox: e.target.checked })}
                  className="h-5 w-5"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "th" ? "แสดงกล่องค้นหารายวิชาบน Banner" : "Display course search box on banner"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="overlayOpacity">{language === "th" ? "ความเข้มเงาพื้นหลัง (%)" : "Overlay Opacity (%)"}</Label>
                <span className="text-sm font-medium">{formData.overlayOpacity}%</span>
              </div>
              <input
                type="range"
                id="overlayOpacity"
                min="0"
                max="90"
                step="5"
                value={formData.overlayOpacity}
                onChange={(e) => setFormData({ ...formData, overlayOpacity: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "th" ? "สีและรูปแบบ" : "Colors & Style"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="backgroundColor">{language === "th" ? "สีพื้นหลัง" : "Background Color"}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.backgroundColor?.includes("gradient") ? "#667eea" : formData.backgroundColor}
                  onChange={(e) => handleChange("backgroundColor", e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.backgroundColor}
                  onChange={(e) => handleChange("backgroundColor", e.target.value)}
                  placeholder="#ffffff or gradient"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textColor">{language === "th" ? "สีข้อความ" : "Text Color"}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.textColor}
                  onChange={(e) => handleChange("textColor", e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.textColor}
                  onChange={(e) => handleChange("textColor", e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">{language === "th" ? "สีเน้น (ปุ่ม)" : "Accent Color (Button)"}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => handleChange("accentColor", e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.accentColor}
                  onChange={(e) => handleChange("accentColor", e.target.value)}
                  placeholder="#ff0000"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </form >
  );
}
