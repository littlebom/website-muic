"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Popup } from "@/lib/types";
import { getImageUrl } from "@/lib/utils";

interface PopupFormProps {
  popup?: Popup;
  language: "th" | "en";
}

export function PopupForm({ popup, language }: PopupFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: popup?.title || "",
    titleEn: popup?.titleEn || "",
    description: popup?.description || "",
    descriptionEn: popup?.descriptionEn || "",
    imageId: popup?.imageId || "",
    linkUrl: popup?.linkUrl || "",
    buttonText: popup?.buttonText || "",
    buttonTextEn: popup?.buttonTextEn || "",
    isActive: popup?.isActive ?? true,
    startDate: popup?.startDate ? new Date(popup.startDate).toISOString().slice(0, 16) : "",
    endDate: popup?.endDate ? new Date(popup.endDate).toISOString().slice(0, 16) : "",
    displayOrder: popup?.displayOrder ?? 0,
    showOnce: popup?.showOnce ?? false,
  });

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = popup ? `/api/popups/${popup.id}` : "/api/popups";
      const method = popup ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = "Failed to save popup";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      router.push("/admin/popups");
      router.refresh();
    } catch (error) {
      console.error("Error saving popup:", error);
      alert(`Failed to save popup: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {popup
              ? language === "th" ? "แก้ไข Popup" : "Edit Popup"
              : language === "th" ? "สร้าง Popup" : "Create Popup"}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/popups">
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
      {formData.imageId && (
        <Card>
          <CardHeader>
            <CardTitle>{language === "th" ? "ตัวอย่าง Popup" : "Popup Preview"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-2xl overflow-hidden">
              <div className="relative h-64">
                <Image
                  src={getImageUrl(formData.imageId)}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">
                  {language === "th" ? formData.title : formData.titleEn}
                </h3>
                {(formData.description || formData.descriptionEn) && (
                  <p className="text-sm text-gray-600 mb-4">
                    {language === "th" ? formData.description : formData.descriptionEn}
                  </p>
                )}
                {(formData.buttonText || formData.buttonTextEn) && formData.linkUrl && (
                  <button className="w-full bg-primary text-white py-2 px-4 rounded-md">
                    {language === "th" ? formData.buttonText : formData.buttonTextEn}
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <Label htmlFor="imageId">{language === "th" ? "รูปภาพ Popup" : "Popup Image"} *</Label>
            <div className="flex gap-2">
              <Input
                id="imageId"
                value={formData.imageId}
                onChange={(e) => handleChange("imageId", e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1"
                required
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={async () => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      setUploading(true);
                      try {
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("imageType", "square");

                        const response = await fetch("/api/upload", {
                          method: "POST",
                          body: formData,
                        });

                        if (!response.ok) {
                          throw new Error("Upload failed");
                        }

                        const data = await response.json();
                        if (data.success && data.url) {
                          handleChange("imageId", data.url);
                        } else {
                          throw new Error(data.error || "Upload failed");
                        }
                      } catch (error) {
                        console.error("Upload error:", error);
                        alert(
                          language === "th"
                            ? "ไม่สามารถอัพโหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง"
                            : "Failed to upload file. Please try again."
                        );
                      } finally {
                        setUploading(false);
                      }
                    }
                  };
                  input.click();
                }}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {uploading
                  ? (language === "th" ? "กำลังอัพโหลด..." : "Uploading...")
                  : (language === "th" ? "อัพโหลด" : "Upload")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Link & Button */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "th" ? "ลิงก์และปุ่ม" : "Link & Button"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkUrl">{language === "th" ? "ลิงก์ปุ่ม" : "Button Link"}</Label>
            <Input
              id="linkUrl"
              value={formData.linkUrl}
              onChange={(e) => handleChange("linkUrl", e.target.value)}
              placeholder="https://example.com"
            />
          </div>

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
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "th" ? "การตั้งค่า" : "Settings"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayOrder">{language === "th" ? "ลำดับการแสดง" : "Display Order"}</Label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) => handleChange("displayOrder", parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">{language === "th" ? "วันที่เริ่มต้น" : "Start Date"}</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">{language === "th" ? "วันที่สิ้นสุด" : "End Date"}</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange("isActive", checked as boolean)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              {language === "th" ? "เปิดใช้งาน" : "Active"}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="showOnce"
              checked={formData.showOnce}
              onCheckedChange={(checked) => handleChange("showOnce", checked as boolean)}
            />
            <Label htmlFor="showOnce" className="cursor-pointer">
              {language === "th" ? "แสดงเพียงครั้งเดียว (เก็บ cookie)" : "Show only once (use cookie)"}
            </Label>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
