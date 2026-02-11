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
import { Pencil, Trash2, Eye } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import type { News } from "@/lib/types";

interface NewsListProps {
  initialNews: News[];
}

export function NewsList({ initialNews }: NewsListProps) {
  const router = useRouter();
  const [news, setNews] = useState<News[]>(initialNews);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`คุณต้องการลบข่าว "${title}" หรือไม่?`)) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/news/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete news");
      }

      // Remove from local state
      setNews(news.filter((item) => item.id !== id));

      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error("Error deleting news:", error);
      alert(
        error instanceof Error
          ? error.message
          : "ไม่สามารถลบข่าวได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Image</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Content Preview</TableHead>
          <TableHead>Published</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {news.map((item) => {
          return (
            <TableRow key={item.id}>
              <TableCell>
                {item.imageId && (
                  <div className="w-16 h-16 relative rounded overflow-hidden">
                    <SafeImage
                      src={item.imageId}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium max-w-xs">
                {item.title}
              </TableCell>
              <TableCell className="max-w-md">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.content}
                </p>
              </TableCell>
              <TableCell>
                {new Date(item.createdAt).toLocaleDateString("th-TH")}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/news/${item.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/news/${item.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id, item.title)}
                    disabled={deletingId === item.id}
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
  );
}
