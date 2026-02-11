"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Instructor, Institution } from "@/lib/types";
import { SafeImage } from "@/components/safe-image";
import { ImageUploadWithCrop } from "@/components/admin/image-upload-with-crop";
import { Upload, X } from "lucide-react";

interface InstructorFormProps {
  instructor?: Instructor;
}

export function InstructorForm({ instructor }: InstructorFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(
    instructor?.imageUrl
      ? (instructor.imageUrl.startsWith("http") || instructor.imageUrl.startsWith("/")
        ? instructor.imageUrl
        : `/uploads/${instructor.imageUrl}`)
      : ""
  );
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  const [formData, setFormData] = useState({
    name: instructor?.name || "",
    nameEn: instructor?.nameEn || "",
    title: instructor?.title || "",
    institutionId: instructor?.institutionId || "",
    bio: instructor?.bio || "",
    email: instructor?.email || "",
    imageUrl: instructor?.imageUrl || "",
  });

  // Fetch institutions
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const response = await fetch("/api/institutions");
        if (response.ok) {
          const data = await response.json();
          setInstitutions(Array.isArray(data) ? data : data.data || []);
        }
      } catch (error) {
        console.error("Error fetching institutions:", error);
      }
    };
    fetchInstitutions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = instructor
        ? `/api/instructors/${instructor.id}`
        : "/api/instructors";
      const method = instructor ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save instructor");
      }

      router.push("/admin/instructors");
      router.refresh();
    } catch (error) {
      console.error("Error saving instructor:", error);
      alert("Failed to save instructor. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };



  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Instructor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500 text-center">Profile photo for instructor</p>
              <div className="flex justify-center">
                <div className="max-w-xs w-full">
                  <ImageUploadWithCrop
                    imageType="instructor"
                    currentImageUrl={imagePreview}
                    onImageUploaded={(url) => {
                      setImagePreview(url);
                      handleChange("imageUrl", url);
                    }}
                    onImageRemoved={() => {
                      setImagePreview("");
                      handleChange("imageUrl", "");
                    }}
                    label="Profile Photo (1:1 ratio)"
                  />
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Recommended size: 400x400 pixels (Aspect ratio 1:1)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อ (ไทย) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="เช่น ดร.สมชาย ใจดี"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">ชื่อ (อังกฤษ) *</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => handleChange("nameEn", e.target.value)}
                  placeholder="e.g. Dr. Somchai Jaidee"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">ตำแหน่ง *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="เช่น ผู้ช่วยศาสตราจารย์"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="institutionId">สถาบันผู้พัฒนา *</Label>
              <select
                id="institutionId"
                value={formData.institutionId}
                onChange={(e) => handleChange("institutionId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">เลือกสถาบัน</option>
                {institutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name} ({institution.abbreviation})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : instructor
                ? "Update Instructor"
                : "Create Instructor"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/instructors")}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
