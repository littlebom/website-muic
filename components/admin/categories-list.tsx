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
import { getIconComponent } from "@/lib/icon-map";
import type { Category } from "@/lib/types";

interface CategoriesListProps {
  initialCategories: Category[];
}

export function CategoriesList({ initialCategories }: CategoriesListProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบหมวดหมู่ "${name}" หรือไม่?`)) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete category");
      }

      // Remove from local state
      setCategories(categories.filter((category) => category.id !== id));

      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert(
        error instanceof Error
          ? error.message
          : "ไม่สามารถลบหมวดหมู่ได้ กรุณาลองใหม่อีกครั้ง"
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
            <TableHead>Icon</TableHead>
            <TableHead>Name (TH)</TableHead>
            <TableHead>Name (EN)</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
        {categories.map((category) => {
          const IconComponent = getIconComponent(category.icon);
          return (
            <TableRow key={category.id}>
              <TableCell>
                <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-lg">
                  <IconComponent className="w-5 h-5 text-primary" />
                </div>
              </TableCell>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>{category.nameEn}</TableCell>
              <TableCell>
                {new Date(category.createdAt).toLocaleDateString("th-TH")}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/categories/${category.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id, category.name)}
                    disabled={deletingId === category.id}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
        </TableBody>
      </Table>
    </>
  );
}

export function ExportCategoriesButton({ categories }: { categories: Category[] }) {
  const handleExport = () => {
    // Create CSV content with UTF-8 BOM
    const headers = ["categoryId", "Name (TH)", "Name (EN)"];
    const rows = categories.map((cat) => [
      cat.id,
      cat.name,
      cat.nameEn,
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
    link.setAttribute("download", `categories-export-${new Date().toISOString().split('T')[0]}.csv`);
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
