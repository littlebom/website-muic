"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as LucideIcons from "lucide-react";

const getIconComponent = (iconName: string) => {
  const icons = LucideIcons as any;
  return icons[iconName] || LucideIcons.BookOpen;
};

interface CourseType {
  id: string;
  name: string;
  nameEn: string;
  icon?: string | null;
  description?: string | null;
}

interface CourseTypesListProps {
  initialCourseTypes: CourseType[];
}

export function CourseTypesList({ initialCourseTypes }: CourseTypesListProps) {
  const router = useRouter();
  const [courseTypes, setCourseTypes] = useState<CourseType[]>(initialCourseTypes);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบประเภทรายวิชา "${name}" หรือไม่?`)) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/course-types/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete course type");
      }

      // Remove from local state
      setCourseTypes(courseTypes.filter((type) => type.id !== id));

      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error("Error deleting course type:", error);
      alert(
        error instanceof Error
          ? error.message
          : "ไม่สามารถลบประเภทรายวิชาได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Icon</TableHead>
            <TableHead>ชื่อภาษาไทย</TableHead>
            <TableHead>ชื่อภาษาอังกฤษ</TableHead>
            <TableHead>รายละเอียด</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courseTypes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                ไม่มีข้อมูลประเภทรายวิชา
              </TableCell>
            </TableRow>
          ) : (
            courseTypes.map((type) => {
              const IconComponent = type.icon ? getIconComponent(type.icon) : LucideIcons.BookOpen;
              return (
                <TableRow key={type.id}>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {IconComponent && <IconComponent className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>{type.nameEn}</TableCell>
                  <TableCell>
                    {type.description ? (
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {type.description}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        ไม่มีรายละเอียด
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/course-types/${type.id}`}>
                        <Button variant="outline" size="sm">
                          <LucideIcons.Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(type.id, type.name)}
                        disabled={deletingId === type.id}
                      >
                        <LucideIcons.Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
