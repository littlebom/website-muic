"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Save, X, Shield, Building2, CheckCircle2, AlertCircle, Loader2, Play, Pause, RefreshCw, BrainCircuit, Database } from "lucide-react";
import type { WebAppSettings, Institution } from "@/lib/types";
import Image from "next/image";
import { ImageUploadWithCrop } from "@/components/admin/image-upload-with-crop";
import { useNotification } from "@/components/ui/notification-dialog";
import { SafeImage } from "@/components/safe-image";
import { useSettings } from "@/components/providers/settings-provider";

export default function AdminSettingsPage() {
  const { refreshSettings } = useSettings();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const { showSuccess, showError, NotificationComponent } = useNotification();
  const [checkingApi, setCheckingApi] = useState(false);
  const [apiStatus, setApiStatus] = useState<'valid' | 'invalid' | null>(null);

  // === SKILL ANALYSIS STATE ===
  interface SkillStats {
    total: number;
    analyzed: number;
    pending: number;
  }
  interface SkillLogItem {
    id: string;
    title: string;
    status: 'success' | 'error';
    message?: string;
    timestamp: Date;
  }
  const [skillStats, setSkillStats] = useState<SkillStats | null>(null);
  const [skillIsRunning, setSkillIsRunning] = useState(false);
  const [skillProgress, setSkillProgress] = useState(0);
  const [skillLogs, setSkillLogs] = useState<SkillLogItem[]>([]);
  const skillIsRunningRef = useRef(false);

  // === GLOBAL STATE (Super Admin) ===
  const [globalFormData, setGlobalFormData] = useState<Partial<WebAppSettings>>({});

  // === INSTITUTION STATE (Institution Admin) ===
  const [institutionFormData, setInstitutionFormData] = useState<Partial<Institution>>({});

  // Previews
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [courseThumbPreview, setCourseThumbPreview] = useState<string>("");
  const [institutionLogoPreview, setInstitutionLogoPreview] = useState<string>("");
  const [newsImagePreview, setNewsImagePreview] = useState<string>("");

  useEffect(() => {
    async function init() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (!sessionRes.ok) throw new Error("Failed to fetch session");
        const sessionData = await sessionRes.json();

        if (!sessionData.success || !sessionData.user) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        const role = sessionData.user.role;
        setUserRole(role);

        if (role === 'super_admin') {
          await loadGlobalSettings();
          loadSkillStats(); // Load skill analysis stats
        } else if (role === 'institution_admin') {
          await loadInstitutionSettings();
        } else {
          setAccessDenied(true);
        }
      } catch (error) {
        console.error("Init failed:", error);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadGlobalSettings() {
    try {
      const res = await fetch(`/api/settings?t=${Date.now()}`);
      const data = await res.json();
      setGlobalFormData(data);
      setLogoPreview(data.siteLogo || "");
      setCourseThumbPreview(data.defaultCourseThumbnail || "");
      setInstitutionLogoPreview(data.defaultInstitutionLogo || "");
      setNewsImagePreview(data.defaultNewsImage || "");
    } catch (e) {
      console.error(e);
    }
  }

  async function loadInstitutionSettings() {
    try {
      const res = await fetch(`/api/admin/institution-settings?t=${Date.now()}`);
      const result = await res.json();
      if (result.success) {
        setInstitutionFormData(result.data);
        setLogoPreview(result.data.logoUrl || "");
        setBannerPreview(result.data.bannerUrl || "");
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleGlobalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(globalFormData),
      });

      if (response.ok) {
        showSuccess("บันทึกสำเร็จ", "Global Settings saved successfully", 3000);
        await loadGlobalSettings();
        await refreshSettings();
      } else {
        showError("บันทึกไม่สำเร็จ", "Failed to save settings");
      }
    } catch (error) {
      showError("Error", "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleInstitutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/admin/institution-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(institutionFormData),
      });

      const result = await response.json();
      if (result.success) {
        showSuccess("บันทึกสำเร็จ", "Institution Settings saved successfully", 3000);
      } else {
        showError("บันทึกไม่สำเร็จ", result.error || "Failed to save settings");
      }
    } catch (error) {
      showError("Error", "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  // === SKILL ANALYSIS FUNCTIONS ===
  async function loadSkillStats() {
    try {
      const res = await fetch('/api/admin/skills/batch-analyze');
      const data = await res.json();
      if (data.success) {
        setSkillStats(data.stats);
        if (data.stats.total > 0) {
          setSkillProgress(Math.round((data.stats.analyzed / data.stats.total) * 100));
        }
      }
    } catch (e) {
      console.error("Failed to load skill stats", e);
    }
  }

  const toggleSkillAnalysis = async () => {
    if (skillIsRunning) {
      setSkillIsRunning(false);
      skillIsRunningRef.current = false;
    } else {
      setSkillIsRunning(true);
      skillIsRunningRef.current = true;
      processSkillBatchLoop();
    }
  };

  const processSkillBatchLoop = async () => {
    if (!skillIsRunningRef.current) return;

    try {
      const res = await fetch('/api/admin/skills/batch-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 5 })
      });

      const data = await res.json();

      if (data.success) {
        if (data.stats) {
          setSkillStats(data.stats);
          if (data.stats.total > 0) {
            setSkillProgress(Math.round((data.stats.analyzed / data.stats.total) * 100));
          }
        }

        if (data.results && data.results.length > 0) {
          const newLogs = data.results.map((r: any) => ({
            id: r.id,
            title: r.title,
            status: r.status,
            message: r.error,
            timestamp: new Date()
          }));
          setSkillLogs(prev => [...newLogs, ...prev].slice(0, 50));
        }

        if (data.stats.pending === 0 || data.processed === 0) {
          setSkillIsRunning(false);
          skillIsRunningRef.current = false;
          showSuccess("Complete", "All courses have been analyzed!");
          return;
        }

        if (skillIsRunningRef.current) {
          setTimeout(processSkillBatchLoop, 1000);
        }
      } else {
        showError("Error", data.error || "Batch processing failed");
        setSkillIsRunning(false);
        skillIsRunningRef.current = false;
      }
    } catch (error) {
      console.error("Batch loop error", error);
      setSkillIsRunning(false);
      skillIsRunningRef.current = false;
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (accessDenied) return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-96 text-center">
        <CardHeader><CardTitle className="text-red-500">Access Denied</CardTitle></CardHeader>
        <CardContent>You permissions do not allow access to this page.</CardContent>
      </Card>
    </div>
  );

  // ==========================================
  // VIEW: Institution Admin
  // ==========================================
  if (userRole === 'institution_admin') {
    return (
      <div className="max-w-4xl mx-auto pb-10">
        <NotificationComponent />
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Institution Settings
          </h1>
          <p className="text-muted-foreground">Manage your microsite appearance and information</p>
        </div>

        <form onSubmit={handleInstitutionSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Branding & Appearance</CardTitle>
              <CardDescription>Manage your institution's logo, banner, and colors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo - VIEW ONLY */}
              <div className="space-y-2">
                <Label>Institution Logo (View Only)</Label>
                <div className="p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
                  <div className="relative w-24 h-24 bg-white border rounded p-2 overflow-hidden">
                    <SafeImage
                      src={logoPreview}
                      alt="Institution Logo"
                      fill
                      className="object-contain"
                      fallbackType="institution"
                    />
                  </div>
                  <div className="ml-4 flex-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-1 text-amber-600 font-medium">
                      <Shield className="h-4 w-4" />
                      Managed by Super Admin
                    </p>
                    <p>Please contact support to update your logo to ensure system consistency.</p>
                  </div>
                </div>
              </div>



              {/* Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={institutionFormData.primaryColor || "#000000"}
                      onChange={(e) => setInstitutionFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-16 p-1 h-10"
                    />
                    <Input
                      value={institutionFormData.primaryColor || ""}
                      onChange={(e) => setInstitutionFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={institutionFormData.secondaryColor || "#000000"}
                      onChange={(e) => setInstitutionFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-16 p-1 h-10"
                    />
                    <Input
                      value={institutionFormData.secondaryColor || ""}
                      onChange={(e) => setInstitutionFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name (Thai)</Label>
                  <Input
                    value={institutionFormData.name || ""}
                    onChange={(e) => setInstitutionFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name (English)</Label>
                  <Input
                    value={institutionFormData.nameEn || ""}
                    onChange={(e) => setInstitutionFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Description (TH)</Label>
                  <Textarea
                    rows={4}
                    value={institutionFormData.description || ""}
                    onChange={(e) => setInstitutionFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (EN)</Label>
                  <Textarea
                    rows={4}
                    value={institutionFormData.descriptionEn || ""}
                    onChange={(e) => setInstitutionFormData(prev => ({ ...prev, descriptionEn: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Public contact details for your institution microsite.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={institutionFormData.email || ""}
                    onChange={(e) => setInstitutionFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@institution.ac.th"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    value={institutionFormData.phoneNumber || ""}
                    onChange={(e) => setInstitutionFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="02-xxx-xxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Address (TH)</Label>
                  <Textarea
                    rows={3}
                    value={institutionFormData.address || ""}
                    onChange={(e) => setInstitutionFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="ที่อยู่ภาษาไทย..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address (EN)</Label>
                  <Textarea
                    rows={3}
                    value={institutionFormData.addressEn || ""}
                    onChange={(e) => setInstitutionFormData(prev => ({ ...prev, addressEn: e.target.value }))}
                    placeholder="Address in English..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website (Optional)</Label>
                <Input
                  value={institutionFormData.website || ""}
                  onChange={(e) => setInstitutionFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Google Map Embed URL (Optional)</Label>
                <Input
                  value={institutionFormData.mapUrl || ""}
                  onChange={(e) => setInstitutionFormData(prev => ({ ...prev, mapUrl: e.target.value }))}
                  placeholder="https://www.google.com/maps/embed?..."
                />
                <p className="text-xs text-muted-foreground">
                  Paste the <code>src</code> URL from the Google Maps "Embed a map" code.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end sticky bottom-4">
            <Button type="submit" size="lg" disabled={saving} className="shadow-lg">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  // ==========================================
  // VIEW: Super Admin (Global Settings)
  // ==========================================
  return (
    <>
      <NotificationComponent />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Global Settings</h1>
          <p className="text-muted-foreground">Manage web application global settings</p>
        </div>

        <form onSubmit={handleGlobalSubmit} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full h-auto grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              <TabsTrigger value="general">General Settings</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="preloader">Media Management</TabsTrigger>
              <TabsTrigger value="api">API Integration</TabsTrigger>
              <TabsTrigger value="smtp">SMTP / Email</TabsTrigger>
              <TabsTrigger value="skills">Skill Analysis</TabsTrigger>
              <TabsTrigger value="system">System Maintenance</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={globalFormData.siteName || ""}
                      onChange={(e) =>
                        setGlobalFormData({ ...globalFormData, siteName: e.target.value })
                      }
                      placeholder="ThaiMOOC"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Site Logo</Label>
                    {logoPreview && (
                      <div className="relative w-48 h-24 border rounded-lg overflow-hidden bg-gray-50">
                        <SafeImage
                          src={logoPreview}
                          alt="Logo Preview"
                          fill
                          className="object-contain p-2"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setGlobalFormData(prev => ({ ...prev, siteLogo: "" }));
                            setLogoPreview("");
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <ImageUploadWithCrop
                      imageType="logo"
                      uploadId="site-logo"
                      currentImageUrl={globalFormData.siteLogo || ""}
                      onImageUploaded={(url) => {
                        setGlobalFormData((prev) => ({ ...prev, siteLogo: url }));
                        setLogoPreview(url);
                      }}
                      showPreview={false}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Footer Logo Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Footer Logo / โลโก้ส่วนท้าย</CardTitle>
                  <CardDescription>สำหรับ Footer พื้นหลังสีเข้ม - ใช้ Logo สีขาวหรือสว่างเพื่อให้ตัดกับพื้นหลัง</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {globalFormData.footerLogo && (
                    <div className="relative w-48 h-24 border rounded-lg overflow-hidden bg-slate-800">
                      <SafeImage
                        src={globalFormData.footerLogo}
                        alt="Footer Logo Preview"
                        fill
                        className="object-contain p-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setGlobalFormData(prev => ({ ...prev, footerLogo: "" }));
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <ImageUploadWithCrop
                    imageType="logo"
                    uploadId="footer-logo"
                    currentImageUrl={globalFormData.footerLogo || ""}
                    onImageUploaded={(url) => {
                      setGlobalFormData((prev) => ({ ...prev, footerLogo: url }));
                    }}
                    showPreview={false}
                  />
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input value={globalFormData.contactEmail || ""} onChange={(e) => setGlobalFormData({ ...globalFormData, contactEmail: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input value={globalFormData.contactPhone || ""} onChange={(e) => setGlobalFormData({ ...globalFormData, contactPhone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>My Classroom URL / ลิงก์เข้าห้องเรียน</Label>
                    <Input
                      value={globalFormData.classroomUrl || ""}
                      onChange={(e) => setGlobalFormData({ ...globalFormData, classroomUrl: e.target.value })}
                      placeholder="https://learn.thaimooc.ac.th/dashboard"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Address (TH)</Label>
                      <Textarea value={globalFormData.address || ""} onChange={(e) => setGlobalFormData({ ...globalFormData, address: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Address (EN)</Label>
                      <Textarea value={globalFormData.addressEn || ""} onChange={(e) => setGlobalFormData({ ...globalFormData, addressEn: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>About Us (TH)</Label>
                      <Textarea
                        value={globalFormData.aboutUs || ""}
                        onChange={(e) => setGlobalFormData({ ...globalFormData, aboutUs: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>About Us (EN)</Label>
                      <Textarea
                        value={globalFormData.aboutUsEn || ""}
                        onChange={(e) => setGlobalFormData({ ...globalFormData, aboutUsEn: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Google Map Embed URL</Label>
                    <Input
                      value={globalFormData.mapUrl || ""}
                      onChange={(e) => setGlobalFormData({ ...globalFormData, mapUrl: e.target.value })}
                      placeholder="https://www.google.com/maps/embed?..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Link from Google Maps "Embed a map" (src attribute)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="space-y-6 mt-6">
              {/* Social Media Fields reused */}
              <Card>
                <CardHeader><CardTitle>Social Media Links</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Facebook URL</Label>
                    <Input value={globalFormData.facebookUrl || ""} onChange={(e) => setGlobalFormData({ ...globalFormData, facebookUrl: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Twitter URL</Label>
                    <Input value={globalFormData.twitterUrl || ""} onChange={(e) => setGlobalFormData({ ...globalFormData, twitterUrl: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>YouTube URL</Label>
                    <Input value={globalFormData.youtubeUrl || ""} onChange={(e) => setGlobalFormData({ ...globalFormData, youtubeUrl: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Line URL</Label>
                    <Input value={globalFormData.lineUrl || ""} onChange={(e) => setGlobalFormData({ ...globalFormData, lineUrl: e.target.value })} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preloader" className="space-y-6 mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Preloader Configuration</CardTitle>
                    <CardDescription>Customize the loading screen appearance.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">Enable Preloader</Label>
                        <p className="text-sm text-muted-foreground">
                          Show a loading screen when navigating between pages.
                        </p>
                      </div>
                      <Switch
                        checked={globalFormData.preloaderEnabled || false}
                        onCheckedChange={(checked) => setGlobalFormData({ ...globalFormData, preloaderEnabled: checked })}
                      />
                    </div>

                    {globalFormData.preloaderEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-2">
                          <Label>Preloader Title</Label>
                          <Input
                            value={globalFormData.preloaderTitle || ""}
                            onChange={(e) => setGlobalFormData({ ...globalFormData, preloaderTitle: e.target.value })}
                            placeholder="Loading..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Preloader Subtitle</Label>
                          <Input
                            value={globalFormData.preloaderSubtitle || ""}
                            onChange={(e) => setGlobalFormData({ ...globalFormData, preloaderSubtitle: e.target.value })}
                            placeholder="Please wait..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Primary Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={globalFormData.preloaderPrimaryColor || "#000000"}
                              onChange={(e) => setGlobalFormData({ ...globalFormData, preloaderPrimaryColor: e.target.value })}
                              className="w-16 p-1 h-10"
                            />
                            <Input
                              value={globalFormData.preloaderPrimaryColor || ""}
                              onChange={(e) => setGlobalFormData({ ...globalFormData, preloaderPrimaryColor: e.target.value })}
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Background Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={globalFormData.preloaderBackgroundColor || "#ffffff"}
                              onChange={(e) => setGlobalFormData({ ...globalFormData, preloaderBackgroundColor: e.target.value })}
                              className="w-16 p-1 h-10"
                            />
                            <Input
                              value={globalFormData.preloaderBackgroundColor || ""}
                              onChange={(e) => setGlobalFormData({ ...globalFormData, preloaderBackgroundColor: e.target.value })}
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Default Images</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Default Course Thumbnail</Label>
                      {courseThumbPreview && (
                        <div className="relative w-64 h-36 border">
                          <SafeImage src={courseThumbPreview} alt="Preview" fill className="object-cover" />
                        </div>
                      )}
                      <ImageUploadWithCrop
                        imageType="course"
                        currentImageUrl={globalFormData.defaultCourseThumbnail || ""}
                        onImageUploaded={(url) => {
                          setGlobalFormData(prev => ({ ...prev, defaultCourseThumbnail: url }));
                          setCourseThumbPreview(url);
                        }}
                        showPreview={false}
                      />
                    </div>


                    <div className="space-y-2">
                      <Label>Default Institution Logo</Label>
                      {institutionLogoPreview && (
                        <div className="relative w-32 h-32 border bg-gray-50 rounded-lg overflow-hidden">
                          <SafeImage src={institutionLogoPreview} alt="Preview" fill className="object-contain p-2" />
                        </div>
                      )}
                      <ImageUploadWithCrop
                        imageType="logo"
                        currentImageUrl={globalFormData.defaultInstitutionLogo || ""}
                        onImageUploaded={(url) => {
                          setGlobalFormData(prev => ({ ...prev, defaultInstitutionLogo: url }));
                          setInstitutionLogoPreview(url);
                        }}
                        showPreview={false}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Default News Image</Label>
                      {newsImagePreview && (
                        <div className="relative w-64 h-36 border bg-gray-50 rounded-lg overflow-hidden">
                          <SafeImage src={newsImagePreview} alt="Preview" fill className="object-cover" />
                        </div>
                      )}
                      <ImageUploadWithCrop
                        imageType="news"
                        currentImageUrl={globalFormData.defaultNewsImage || ""}
                        onImageUploaded={(url) => {
                          setGlobalFormData(prev => ({ ...prev, defaultNewsImage: url }));
                          setNewsImagePreview(url);
                        }}
                        showPreview={false}
                      />
                    </div>

                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-6 mt-6">
              <Card>
                <CardHeader><CardTitle>API Configuration</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Gemini API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          value={globalFormData.geminiApiKey || ""}
                          onChange={(e) => setGlobalFormData({ ...globalFormData, geminiApiKey: e.target.value })}
                          placeholder="AIzaSy..."
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={async () => {
                            if (!globalFormData.geminiApiKey) {
                              showError("Error", "Please enter an API Key first");
                              return;
                            }
                            setCheckingApi(true);
                            try {
                              const res = await fetch('/api/settings/test-gemini', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ apiKey: globalFormData.geminiApiKey })
                              });
                              const data = await res.json();
                              if (data.success) {
                                setApiStatus('valid');
                                showSuccess("Connection Successful", "Gemini API Key is valid");
                              } else {
                                setApiStatus('invalid');
                                showError("Connection Failed", data.error || "Invalid API Key");
                              }
                            } catch (e) {
                              setApiStatus('invalid');
                              showError("Error", "Failed to test connection");
                            } finally {
                              setCheckingApi(false);
                            }
                          }}
                          disabled={checkingApi || !globalFormData.geminiApiKey}
                        >
                          {checkingApi ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test Connection"}
                        </Button>
                      </div>
                    </div>

                    {apiStatus && (
                      <div className={`flex items-center gap-2 text-sm p-3 rounded-md ${apiStatus === 'valid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                        {apiStatus === 'valid' ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>API Key is valid and active</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            <span>Failed to connect to Gemini API</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* AI Chatbot Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Chatbot Assistant</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable AI Chatbot</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable the AI Chatbot assistant for the main website.
                      </p>
                    </div>
                    <Switch
                      checked={globalFormData.chatbotEnabled || false}
                      onCheckedChange={(checked) => setGlobalFormData({ ...globalFormData, chatbotEnabled: checked })}
                    />
                  </div>

                  {!globalFormData.chatbotEnabled && (
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50 mt-2">
                      <h4 className="font-medium text-sm">Line Contact Settings (Fallback)</h4>
                      <div className="space-y-2">
                        <Label>Line Official Account ID</Label>
                        <Input
                          value={globalFormData.lineOfficialId || ""}
                          onChange={(e) => setGlobalFormData({ ...globalFormData, lineOfficialId: e.target.value })}
                          placeholder="@thaimooc"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Line QR Code Image</Label>
                        <ImageUploadWithCrop
                          imageType="square"
                          currentImageUrl={globalFormData.lineQrCodeUrl || ""}
                          onImageUploaded={(url) => setGlobalFormData(prev => ({ ...prev, lineQrCodeUrl: url }))}
                          label="Upload QR Code"
                          className="max-w-[200px]"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BrainCircuit className="h-6 w-6 text-indigo-600" />
                    Course Skill Analysis
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    AI-powered analysis of Hard & Soft Skills for all courses
                  </p>
                </div>
                <Button variant="outline" onClick={loadSkillStats} disabled={skillIsRunning}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${skillIsRunning ? 'animate-spin' : ''}`} />
                  Refresh Stats
                </Button>
              </div>

              {skillStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{skillStats.total}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Analyzed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{skillStats.analyzed}</div>
                      <p className="text-xs text-muted-foreground mt-1">{(skillStats.analyzed / skillStats.total * 100).toFixed(1)}% coverage</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600">{skillStats.pending}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card className="border-indigo-100 overflow-hidden">
                <div className="bg-indigo-50/50 p-6 border-b border-indigo-100">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-indigo-900">Analysis Progress</h3>
                      <p className="text-sm text-indigo-700">
                        {skillIsRunning ? 'Processing courses...' : 'Ready to start'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={toggleSkillAnalysis}
                      size="lg"
                      className={skillIsRunning ? "bg-amber-500 hover:bg-amber-600" : "bg-indigo-600 hover:bg-indigo-700"}
                    >
                      {skillIsRunning ? (
                        <>
                          <Pause className="w-5 h-5 mr-2" /> Pause Analysis
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" /> Start Analysis
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                      <span>Overall Progress</span>
                      <span>{skillProgress}%</span>
                    </div>
                    <Progress value={skillProgress} className="h-3" />
                  </div>
                </div>

                <CardContent className="p-0">
                  <div className="bg-slate-900 text-slate-200 p-4 h-64 overflow-y-auto font-mono text-sm">
                    {skillLogs.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-slate-600">
                        <Database className="w-8 h-8 mr-3 opacity-50" />
                        <span>Waiting to start analysis logs...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {skillLogs.map((log, i) => (
                          <div key={i} className="flex items-start gap-2 border-l-2 border-slate-700 pl-2 py-1">
                            {log.status === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <span className="text-xs text-slate-500 mr-2">
                                {log.timestamp.toLocaleTimeString()}
                              </span>
                              <span className={log.status === 'error' ? 'text-red-400' : 'text-slate-300'}>
                                {log.status === 'success' ? 'Analyzed:' : 'Failed:'} {log.title}
                              </span>
                              {log.message && (
                                <p className="text-xs text-red-400 mt-1 ml-2">{log.message}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Hard Skills (6 Axes)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p><strong>H1:</strong> Data Science & AI Fluency</p>
                    <p><strong>H2:</strong> Digital Development & Security</p>
                    <p><strong>H3:</strong> Technical Project & Process Mgmt</p>
                    <p><strong>H4:</strong> Financial & Strategic Modeling</p>
                    <p><strong>H5:</strong> Specialized Technical Operations</p>
                    <p><strong>H6:</strong> Regulatory & Compliance Skills</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Soft Skills (6 Axes)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p><strong>S1:</strong> Analytical & Critical Thinking</p>
                    <p><strong>S2:</strong> Communication & Collaboration</p>
                    <p><strong>S3:</strong> Leadership & Social Influence</p>
                    <p><strong>S4:</strong> Adaptability & Resilience</p>
                    <p><strong>S5:</strong> Creativity & Initiative</p>
                    <p><strong>S6:</strong> Customer & Service Orientation</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* SMTP / Email Settings Tab */}
            <TabsContent value="smtp" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>SMTP Configuration / การตั้งค่า SMTP</CardTitle>
                  <CardDescription>
                    ตั้งค่า SMTP Server สำหรับส่งอีเมลจากระบบ เช่น การแจ้งเตือน, ยืนยันตัวตน เป็นต้น
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>SMTP Host / Server</Label>
                      <Input
                        value={globalFormData.smtpHost || ""}
                        onChange={(e) => setGlobalFormData({ ...globalFormData, smtpHost: e.target.value })}
                        placeholder="smtp.gmail.com"
                      />
                      <p className="text-xs text-muted-foreground">เช่น smtp.gmail.com, smtp.office365.com</p>
                    </div>
                    <div className="space-y-2">
                      <Label>SMTP Port</Label>
                      <Input
                        type="number"
                        value={globalFormData.smtpPort || ""}
                        onChange={(e) => setGlobalFormData({ ...globalFormData, smtpPort: parseInt(e.target.value) || undefined })}
                        placeholder="587"
                      />
                      <p className="text-xs text-muted-foreground">ทั่วไป: 587 (TLS), 465 (SSL), 25 (ไม่เข้ารหัส)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Username / อีเมลผู้ส่ง</Label>
                      <Input
                        type="email"
                        value={globalFormData.smtpUsername || ""}
                        onChange={(e) => setGlobalFormData({ ...globalFormData, smtpUsername: e.target.value })}
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password / App Password</Label>
                      <Input
                        type="password"
                        value={globalFormData.smtpPassword || ""}
                        onChange={(e) => setGlobalFormData({ ...globalFormData, smtpPassword: e.target.value })}
                        placeholder="••••••••••••"
                      />
                      <p className="text-xs text-muted-foreground">สำหรับ Gmail ให้ใช้ App Password</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>From Email / อีเมลผู้ส่ง</Label>
                      <Input
                        type="email"
                        value={globalFormData.smtpFromEmail || ""}
                        onChange={(e) => setGlobalFormData({ ...globalFormData, smtpFromEmail: e.target.value })}
                        placeholder="noreply@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>From Name / ชื่อผู้ส่ง</Label>
                      <Input
                        value={globalFormData.smtpFromName || ""}
                        onChange={(e) => setGlobalFormData({ ...globalFormData, smtpFromName: e.target.value })}
                        placeholder="MUIC Platform"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <Switch
                      id="smtpSecure"
                      checked={globalFormData.smtpSecure || false}
                      onCheckedChange={(checked) => setGlobalFormData({ ...globalFormData, smtpSecure: checked })}
                    />
                    <Label htmlFor="smtpSecure">Use SSL/TLS (Secure Connection)</Label>
                  </div>

                  <div className="flex justify-end space-x-4 mt-6">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save SMTP Settings
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>คำแนะนำการตั้งค่า</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">📧 Gmail</h4>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>Host: smtp.gmail.com</li>
                        <li>Port: 587 (TLS) หรือ 465 (SSL)</li>
                        <li>ต้องเปิด 2-Step Verification</li>
                        <li>ใช้ App Password แทน Password จริง</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">📧 Microsoft 365 / Outlook</h4>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>Host: smtp.office365.com</li>
                        <li>Port: 587 (TLS)</li>
                        <li>Username: อีเมล Microsoft 365</li>
                        <li>Password: รหัสผ่านบัญชี</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-500" />
                    System Maintenance
                  </CardTitle>
                  <CardDescription>
                    จัดการระบบและดูแลรักษาข้อมูล (System Maintenance & Data Management)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border rounded-lg p-6 bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-orange-500" />
                      System Cache
                    </h3>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        <p>ล้างข้อมูลแคชทั้งหมดของระบบ (Redis & Next.js Cache)</p>
                        <p>ควรทำเมื่อมีการแก้ไขข้อมูลแล้วหน้าเว็บยังแสดงข้อมูลเก่า หรือรูปภาพไม่ยอมเปลี่ยน</p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-orange-200 hover:bg-orange-50 text-orange-700 dark:border-orange-800 dark:hover:bg-orange-900/20 dark:text-orange-400"
                        onClick={async () => {
                          if (!confirm('ยืนยันการล้างแคชระบบทั้งหมด?\nConfirm clear all system cache?')) return;

                          try {
                            setLoading(true);
                            const res = await fetch('/api/admin/cache/clear', { method: 'POST', body: JSON.stringify({}) });
                            const data = await res.json();

                            if (data.success) {
                              showSuccess('Success', 'System cache cleared successfully');
                              // Refresh current settings too
                              await refreshSettings();
                            } else {
                              showError('Error', data.error || 'Failed to clear cache');
                            }
                          } catch (e) {
                            showError('Error', 'Failed to connect to server');
                          } finally {
                            setLoading(false);
                          }
                        }}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Clear System Cache
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs >

          <div className="flex justify-end p-4 bg-white border-t sticky bottom-0 z-10">
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? "Saving..." : "Save Global Settings"}
            </Button>
          </div>
        </form >
      </div >
    </>
  );
}
