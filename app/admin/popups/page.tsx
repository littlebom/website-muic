"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import type { Popup } from "@/lib/types";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";

export default function PopupsPage() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopups();
  }, []);

  async function fetchPopups() {
    try {
      const response = await fetch("/api/popups");
      const data = await response.json();
      if (data.success) {
        const popupsData = data.data.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          startDate: p.startDate ? new Date(p.startDate) : null,
          endDate: p.endDate ? new Date(p.endDate) : null,
        }));
        setPopups(popupsData);
      }
    } catch (error) {
      console.error("Failed to fetch popups:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบ Popup นี้?")) return;

    try {
      const response = await fetch(`/api/popups/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPopups();
      } else {
        alert("ไม่สามารถลบ Popup ได้");
      }
    } catch (error) {
      console.error("Error deleting popup:", error);
      alert("เกิดข้อผิดพลาดในการลบ Popup");
    }
  }

  async function toggleActive(popup: Popup) {
    try {
      const response = await fetch(`/api/popups/${popup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !popup.isActive }),
      });

      if (response.ok) {
        fetchPopups();
      } else {
        alert("ไม่สามารถเปลี่ยนสถานะได้");
      }
    } catch (error) {
      console.error("Error toggling active:", error);
      alert("เกิดข้อผิดพลาด");
    }
  }

  if (loading) {
    return <div className="p-8">กำลังโหลด...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">จัดการ Popups</h1>
          <p className="text-muted-foreground mt-1">
            สร้างและจัดการ popup ที่แสดงบนหน้าหลัก
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/popups/new">
            <Plus className="h-4 w-4 mr-2" />
            สร้าง Popup ใหม่
          </Link>
        </Button>
      </div>

      {popups.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">
              ยังไม่มี Popup
            </p>
            <Button asChild>
              <Link href="/admin/popups/new">
                <Plus className="h-4 w-4 mr-2" />
                สร้าง Popup แรก
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popups.map((popup) => (
            <Card key={popup.id} className="overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={getImageUrl(popup.imageId)}
                  alt={popup.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    size="sm"
                    variant={popup.isActive ? "default" : "secondary"}
                    onClick={() => toggleActive(popup)}
                  >
                    {popup.isActive ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">{popup.title}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {popup.titleEn}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    <div>ลำดับ: {popup.displayOrder}</div>
                    {popup.startDate && (
                      <div>เริ่ม: {new Date(popup.startDate).toLocaleDateString('th-TH')}</div>
                    )}
                    {popup.endDate && (
                      <div>สิ้นสุด: {new Date(popup.endDate).toLocaleDateString('th-TH')}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/popups/${popup.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(popup.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
