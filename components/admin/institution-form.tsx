"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SafeImage } from "@/components/safe-image";
import { ImageUploadWithCrop } from "@/components/admin/image-upload-with-crop";
import { Upload, X, Globe, Phone, Mail, MapPin } from "lucide-react";
import type { Institution } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InstitutionFormProps {
  institution?: Institution;
}

export function InstitutionForm({ institution }: InstitutionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>(
    institution?.logoUrl
      ? (institution.logoUrl.startsWith("http") || institution.logoUrl.startsWith("/")
        ? institution.logoUrl
        : `/uploads/${institution.logoUrl}`)
      : ""
  );



  const [formData, setFormData] = useState({
    name: institution?.name || "",
    nameEn: institution?.nameEn || "",
    abbreviation: institution?.abbreviation || "",
    description: institution?.description || "",
    logoUrl: institution?.logoUrl || "",
    website: institution?.website || "",
    // Contact Info
    address: institution?.address || "",
    phoneNumber: institution?.phoneNumber || "",
    email: institution?.email || "",
    socialLinks: institution?.socialLinks || { facebook: "", line: "", twitter: "", youtube: "" },
    metaTitle: institution?.metaTitle || "",
    metaDescription: institution?.metaDescription || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = institution
        ? `/api/institutions/${institution.id}`
        : "/api/institutions";
      const method = institution ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save institution");
      }

      router.push("/admin/institutions");
      router.refresh();
    } catch (error) {
      console.error("Error saving institution:", error);
      alert("Failed to save institution. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  // Load default institution logo for new institutions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    async function loadDefaultLogo() {
      if (!institution && !formData.logoUrl) {
        console.log('[Institution Form] Loading default logo...');
        try {
          const response = await fetch('/api/settings');
          if (response.ok) {
            const data = await response.json();
            console.log('[Institution Form] Settings data:', data);
            if (data.defaultInstitutionLogo) {
              console.log('[Institution Form] Setting default logo:', data.defaultInstitutionLogo);
              setFormData(prev => ({
                ...prev,
                logoUrl: data.defaultInstitutionLogo
              }));
              setLogoPreview(data.defaultInstitutionLogo);
            } else {
              console.log('[Institution Form] No default logo found in settings');
            }
          }
        } catch (error) {
          console.error('[Institution Form] Failed to load default institution logo:', error);
        }
      } else {
        console.log('[Institution Form] Skipping default load - institution:', !!institution, 'logoUrl:', formData.logoUrl);
      }
    }

    loadDefaultLogo();
  }, []); // Run only once on mount

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Institution Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload Section - Centered at Top */}
            <div className="flex flex-col items-center justify-center pb-6 border-b">
              <Label className="mb-4">Institution Logo</Label>
              <div className="w-48">
                <ImageUploadWithCrop
                  imageType="institution"
                  currentImageUrl={logoPreview}
                  onImageUploaded={(url) => {
                    handleChange("logoUrl", url);
                    setLogoPreview(url);
                  }}
                  onImageRemoved={() => {
                    handleChange("logoUrl", "");
                    setLogoPreview("");
                  }}
                  label=""
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Recommended size: 400x400 pixels</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name (TH) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  placeholder="ชื่อสถาบัน (ภาษาไทย)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameEn">Name (EN) *</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => handleChange("nameEn", e.target.value)}
                  required
                  placeholder="Institution Name (English)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="abbreviation">Abbreviation *</Label>
              <Input
                id="abbreviation"
                value={formData.abbreviation}
                onChange={(e) => handleChange("abbreviation", e.target.value)}
                required
                placeholder="e.g., CU, MIT"
              />
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="logoUrl" className="text-sm text-muted-foreground">Or provide Logo URL</Label>
              <Input
                id="logoUrl"
                type="text"
                value={formData.logoUrl}
                onChange={(e) => handleChange("logoUrl", e.target.value)}
                placeholder="https://... or /uploads/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Thai)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
              />
            </div>




          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : institution
                ? "Update Institution"
                : "Create Institution"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/institutions")}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
