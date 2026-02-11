"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Guide {
  id: string;
  title: string;
  category: string | null;
  keywords: string | null;
  is_active: boolean | number;
  view_count: number;
  created_at: string | Date;
}

interface GuidesListProps {
  initialGuides: Guide[];
}

export function GuidesList({ initialGuides }: GuidesListProps) {
  const [guides, setGuides] = useState<Guide[]>(initialGuides);
  const [filter, setFilter] = useState<string>("all");

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`คุณต้องการลบคู่มือ "${title}" หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/guides/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGuides(guides.filter((g) => g.id !== id));
        alert("ลบคู่มือสำเร็จ");
      } else {
        alert("เกิดข้อผิดพลาดในการลบ");
      }
    } catch (error) {
      console.error("Error deleting guide:", error);
      alert("เกิดข้อผิดพลาด");
    }
  };

  const categories = ["all", ...new Set(guides.map((g) => g.category).filter((c): c is string => !!c))];
  const filteredGuides = filter === "all" ? guides : guides.filter((g) => g.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={filter === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(cat)}
          >
            {cat === "all" ? "ทั้งหมด" : cat} ({cat === "all" ? guides.length : guides.filter((g) => g.category === cat).length})
          </Button>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>หัวข้อ</TableHead>
            <TableHead>หมวดหมู่</TableHead>
            <TableHead>คำค้นหา</TableHead>
            <TableHead>ยอดดู</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead className="text-right">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredGuides.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                ไม่มีคู่มือ
              </TableCell>
            </TableRow>
          ) : (
            filteredGuides.map((guide) => (
              <TableRow key={guide.id}>
                <TableCell className="font-medium">{guide.title}</TableCell>
                <TableCell>{guide.category || "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {guide.keywords ? guide.keywords.substring(0, 30) + "..." : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {guide.view_count}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={guide.is_active ? "default" : "secondary"}>
                    {guide.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/guides/${guide.id}`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(guide.id, guide.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
