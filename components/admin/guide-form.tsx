"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface Guide {
  id?: string;
  title: string;
  content: string;
  category: string;
  keywords: string;
  is_active: boolean;
}

interface GuideFormProps {
  guide?: Guide;
  isEdit?: boolean;
}

export function GuideForm({ guide, isEdit = false }: GuideFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Guide>({
    title: guide?.title || "",
    content: guide?.content || "",
    category: guide?.category || "",
    keywords: guide?.keywords || "",
    is_active: guide?.is_active !== undefined ? guide.is_active : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEdit ? `/api/guides/${guide?.id}` : "/api/guides";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(isEdit ? "แก้ไขคู่มือสำเร็จ" : "เพิ่มคู่มือสำเร็จ");
        router.push("/admin/guides");
        router.refresh();
      } else {
        alert("เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "แก้ไขคู่มือ" : "เพิ่มคู่มือใหม่"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">หัวข้อ *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="เช่น วิธีการสมัครเรียนคอร์ส"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">หมวดหมู่</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="เช่น การลงทะเบียน, การประเมินผล"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">คำค้นหา (คั่นด้วยเครื่องหมายจุลภาค)</Label>
            <Input
              id="keywords"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="เช่น สมัครเรียน,ลงทะเบียน,registration"
            />
            <p className="text-xs text-muted-foreground">
              คำค้นหาจะช่วยให้ Chatbot หาคำตอบได้ง่ายขึ้น
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">เนื้อหา *</Label>
            <TiptapEditor
              content={formData.content}
              onChange={(html) => setFormData({ ...formData, content: html })}
            />
            <p className="text-xs text-muted-foreground">
              ใช้ Rich Text Editor สำหรับจัดรูปแบบข้อความ
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">เปิดใช้งาน</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "เพิ่มคู่มือ"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/guides")}
            >
              ยกเลิก
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
