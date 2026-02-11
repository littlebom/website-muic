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
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/safe-image";
import type { Banner } from "@/lib/types";

interface BannersListProps {
  initialBanners: Banner[];
}

export function BannersList({ initialBanners }: BannersListProps) {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`คุณต้องการลบแบนเนอร์ "${title}" หรือไม่?`)) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/banners/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete banner");
      }

      setBanners(banners.filter((banner) => banner.id !== id));
      router.refresh();
    } catch (error) {
      console.error("Error deleting banner:", error);
      alert(
        error instanceof Error
          ? error.message
          : "ไม่สามารถลบแบนเนอร์ได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Image</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Subtitle</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Button</TableHead>
            <TableHead className="w-[100px]">Colors</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {banners.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                ไม่มีแบนเนอร์
              </TableCell>
            </TableRow>
          ) : (
            banners.map((banner) => (
              <TableRow key={banner.id}>
                <TableCell>
                  {banner.imageId ? (
                    <div className="w-20 h-12 relative rounded overflow-hidden bg-gray-100">
                      <SafeImage
                        src={banner.imageId}
                        alt={banner.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-20 h-12 rounded"
                      style={{
                        background: banner.backgroundColor?.includes("gradient")
                          ? banner.backgroundColor
                          : banner.backgroundColor || "#667eea",
                      }}
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="max-w-[200px]">
                    <p className="truncate">{banner.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{banner.titleEn}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[150px]">
                    {banner.subtitle ? (
                      <>
                        <p className="text-sm truncate">{banner.subtitle}</p>
                        <p className="text-xs text-muted-foreground truncate">{banner.subtitleEn}</p>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
                    {banner.description || "-"}
                  </p>
                </TableCell>
                <TableCell>
                  {banner.buttonText ? (
                    <div className="max-w-[150px]">
                      <p className="text-sm font-medium truncate">{banner.buttonText}</p>
                      {banner.linkUrl && (
                        <Link
                          href={banner.linkUrl}
                          className="text-xs text-blue-600 hover:underline truncate block"
                          target="_blank"
                        >
                          {banner.linkUrl}
                        </Link>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {banner.backgroundColor && (
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{
                          background: banner.backgroundColor.includes("gradient")
                            ? banner.backgroundColor
                            : banner.backgroundColor,
                        }}
                        title={`BG: ${banner.backgroundColor}`}
                      />
                    )}
                    {banner.textColor && (
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: banner.textColor }}
                        title={`Text: ${banner.textColor}`}
                      />
                    )}
                    {banner.accentColor && (
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: banner.accentColor }}
                        title={`Accent: ${banner.accentColor}`}
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={banner.isActive ? "default" : "secondary"}>
                    {banner.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/banners/${banner.id}`}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(banner.id, banner.title)}
                      disabled={deletingId === banner.id}
                    >
                      <Trash2 className="h-4 w-4 mr-1 text-red-600" />
                      {deletingId === banner.id ? "..." : "Delete"}
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
