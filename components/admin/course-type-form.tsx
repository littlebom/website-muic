"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconPicker } from "@/components/admin/icon-picker";

interface CourseType {
  id: string;
  name: string;
  nameEn: string;
  icon?: string | null;
  description?: string | null;
}

interface CourseTypeFormProps {
  courseType?: CourseType | null;
}

export function CourseTypeForm({ courseType }: CourseTypeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: courseType?.name || "",
    nameEn: courseType?.nameEn || "",
    icon: courseType?.icon || "",
    description: courseType?.description || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = courseType
        ? `/api/course-types/${courseType.id}`
        : "/api/course-types";
      const method = courseType ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save course type");
      }

      router.push("/admin/course-types");
      router.refresh();
    } catch (error) {
      console.error("Error saving course type:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save course type. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลประเภทรายวิชา</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อภาษาไทย *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="เช่น รายวิชาออนไลน์"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameEn">ชื่อภาษาอังกฤษ *</Label>
            <Input
              id="nameEn"
              value={formData.nameEn}
              onChange={(e) => handleChange("nameEn", e.target.value)}
              placeholder="e.g., Online Course"
              required
            />
          </div>

          <IconPicker
            value={formData.icon}
            onChange={(value) => handleChange("icon", value)}
          />

          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับประเภทรายวิชานี้..."
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "กำลังบันทึก..." : courseType ? "บันทึกการแก้ไข" : "สร้างประเภทรายวิชา"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
