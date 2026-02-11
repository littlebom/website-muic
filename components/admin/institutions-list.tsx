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
import { Pencil, Trash2, Download } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import type { Institution } from "@/lib/types";

interface InstitutionsListProps {
  initialInstitutions: Institution[];
}

export function InstitutionsList({ initialInstitutions }: InstitutionsListProps) {
  const router = useRouter();
  const [institutions, setInstitutions] = useState<Institution[]>(initialInstitutions);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบสถาบัน "${name}" หรือไม่?`)) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/institutions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete institution");
      }

      // Remove from local state
      setInstitutions(institutions.filter((institution) => institution.id !== id));

      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error("Error deleting institution:", error);
      alert(
        error instanceof Error
          ? error.message
          : "ไม่สามารถลบสถาบันได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Logo</TableHead>
            <TableHead>Name (TH)</TableHead>
            <TableHead>Name (EN)</TableHead>
            <TableHead>Abbreviation</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
        {institutions.map((institution) => (
          <TableRow key={institution.id}>
            <TableCell>
              <div className="w-10 h-10 relative rounded overflow-hidden">
                <SafeImage
                  src={institution.logoUrl}
                  alt={institution.name}
                  fill
                  className="object-cover"
                />
              </div>
            </TableCell>
            <TableCell className="font-medium">{institution.name}</TableCell>
            <TableCell>{institution.nameEn}</TableCell>
            <TableCell>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                {institution.abbreviation}
              </span>
            </TableCell>
            <TableCell>
              {new Date(institution.createdAt).toLocaleDateString("th-TH")}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/institutions/${institution.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(institution.id, institution.name)}
                  disabled={deletingId === institution.id}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        </TableBody>
      </Table>
    </>
  );
}

export function ExportInstitutionsButton({ institutions }: { institutions: Institution[] }) {
  const handleExport = () => {
    // Create CSV content with UTF-8 BOM
    const headers = ["institutionId", "Name (TH)", "Name (EN)", "Abbreviation"];
    const rows = institutions.map((inst) => [
      inst.id,
      inst.name,
      inst.nameEn,
      inst.abbreviation,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    // Add BOM for UTF-8 to ensure Thai characters display correctly in Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `institutions-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
}
