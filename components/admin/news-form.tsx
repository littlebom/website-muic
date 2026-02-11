"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import type { News } from "@/lib/types";

interface NewsFormProps {
  news?: News;
}

export function NewsForm({ news }: NewsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: news?.title || "",
    content: news?.content || "",
    imageId: news?.imageId || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = news ? `/api/news/${news.id}` : "/api/news";
      const method = news ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save news");
      }

      router.push("/admin/news");
      router.refresh();
    } catch (error) {
      console.error("Error saving news:", error);
      alert("Failed to save news. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Load default news image for new news articles
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    async function loadDefaultImage() {
      if (!news && !formData.imageId) {
        console.log('[News Form] Loading default image...');
        try {
          const response = await fetch('/api/settings');
          if (response.ok) {
            const data = await response.json();
            console.log('[News Form] Settings data:', data);
            if (data.defaultNewsImage) {
              console.log('[News Form] Setting default image:', data.defaultNewsImage);
              setFormData(prev => ({
                ...prev,
                imageId: data.defaultNewsImage
              }));
            } else {
              console.log('[News Form] No default image found in settings');
            }
          }
        } catch (error) {
          console.error('[News Form] Failed to load default news image:', error);
        }
      } else {
        console.log('[News Form] Skipping default load - news:', !!news, 'imageId:', formData.imageId);
      }
    }

    loadDefaultImage();
  }, []); // Run only once on mount

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>News Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <TiptapEditor
                content={formData.content}
                onChange={(html) => handleChange("content", html)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageId">Image</Label>
              <div className="flex gap-2">
                <Input
                  id="imageId"
                  value={formData.imageId}
                  onChange={(e) => handleChange("imageId", e.target.value)}
                  placeholder="https://example.com/image.jpg or image-id"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={async () => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        setUploading(true);
                        try {
                          const formData = new FormData();
                          formData.append("file", file);
                          formData.append("imageType", "news");

                          const response = await fetch("/api/upload", {
                            method: "POST",
                            body: formData,
                          });

                          if (!response.ok) {
                            throw new Error("Upload failed");
                          }

                          const data = await response.json();
                          if (data.success && data.url) {
                            handleChange("imageId", data.url);
                          } else {
                            throw new Error(data.error || "Upload failed");
                          }
                        } catch (error) {
                          console.error("Upload error:", error);
                          alert("Failed to upload file. Please try again.");
                        } finally {
                          setUploading(false);
                        }
                      }
                    };
                    input.click();
                  }}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
              {formData.imageId && (
                <div className="mt-2 relative w-full max-w-[550px] mx-auto aspect-video border rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={formData.imageId}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Upload an image or enter an image URL
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : news ? "Update News" : "Create News"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/news")}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
