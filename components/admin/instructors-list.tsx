"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import type { Instructor, Institution } from "@/lib/types";

interface InstructorsListProps {
  initialInstructors: Instructor[];
  institutions: Institution[];
}

export function InstructorsList({
  initialInstructors,
  institutions,
}: InstructorsListProps) {
  const router = useRouter();
  const [instructors, setInstructors] = useState<Instructor[]>(initialInstructors);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getInstitutionName = (id: string) => {
    const institution = institutions.find((i) => i.id === id);
    return institution?.name || "Unknown";
  };

  const getInstructorImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return "/placeholder.png";
    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://") ||
      imageUrl.startsWith("/")
    ) {
      return imageUrl;
    }
    return "/placeholder.png";
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบอาจารย์ "${name}" หรือไม่?`)) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/instructors/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete instructor");
      }

      // Remove from local state
      setInstructors(instructors.filter((instructor) => instructor.id !== id));

      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error("Error deleting instructor:", error);
      alert(
        error instanceof Error
          ? error.message
          : "ไม่สามารถลบอาจารย์ได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Photo</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Institution</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {instructors.map((instructor) => (
          <TableRow key={instructor.id}>
            <TableCell>
              <div className="w-10 h-10 relative rounded-full overflow-hidden">
                <SafeImage
                  src={getInstructorImageUrl(instructor.imageUrl || null)}
                  alt={instructor.name}
                  fill
                  className="object-cover"
                />
              </div>
            </TableCell>
            <TableCell className="font-medium">{instructor.name}</TableCell>
            <TableCell>{getInstitutionName(instructor.institutionId)}</TableCell>
            <TableCell>
              {new Date(instructor.createdAt).toLocaleDateString("th-TH")}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/instructors/${instructor.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(instructor.id, instructor.name)}
                  disabled={deletingId === instructor.id}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
