"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WebAppSettings } from "@/lib/types";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { SafeIframe } from "@/components/safe-html";

export default function ContactPage() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<WebAppSettings | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
    loadData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-bold mb-8" style={{ fontSize: "1.25rem" }}>
        {t("ติดต่อเรา", "Contact Us")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* About Us and Contact Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("เกี่ยวกับเรา", "About Us")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t(
                  settings?.aboutUs || "Thai MOOC เป็นแพลตฟอร์มการเรียนรู้ออนไลน์ที่รวบรวมคอร์สเรียนคุณภาพสูงจากสถาบันการศึกษาชั้นนำของประเทศไทย เพื่อส่งเสริมการเรียนรู้ตลอดชีวิตและพัฒนาทักษะที่จำเป็นสำหรับยุคดิจิทัล",
                  settings?.aboutUsEn || "Thai MOOC is an online learning platform that brings together high-quality courses from Thailand's leading educational institutions to promote lifelong learning and develop essential skills for the digital age."
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("ข้อมูลการติดต่อ", "Contact Information")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <Mail className="text-primary mt-1 flex-shrink-0" style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px' }} />
                <div>
                  <h3 className="font-semibold mb-1" style={{ fontSize: "1.25rem" }}>
                    {t("อีเมล", "Email")}
                  </h3>
                  <p className="text-muted-foreground">
                    {settings?.contactEmail || "contact@thaimooc.ac.th"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="text-primary mt-1 flex-shrink-0" style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px' }} />
                <div>
                  <h3 className="font-semibold mb-1" style={{ fontSize: "1.25rem" }}>
                    {t("โทรศัพท์", "Phone")}
                  </h3>
                  <p className="text-muted-foreground">
                    {settings?.contactPhone || "02-123-4567"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin className="text-primary mt-1 flex-shrink-0" style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px' }} />
                <div>
                  <h3 className="font-semibold mb-1" style={{ fontSize: "1.25rem" }}>
                    {t("ที่อยู่", "Address")}
                  </h3>
                  <p className="text-muted-foreground">
                    {settings?.address ||
                      t(
                        "กรุงเทพมหานคร ประเทศไทย",
                        "Bangkok, Thailand"
                      )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock className="text-primary mt-1 flex-shrink-0" style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px' }} />
                <div>
                  <h3 className="font-semibold mb-1" style={{ fontSize: "1.25rem" }}>
                    {t("เวลาทำการ", "Working Hours")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t(
                      "จันทร์ - วันศุกร์: 9:00 - 17:00 น.",
                      "Monday - Friday: 9:00 AM - 5:00 PM"
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map or Additional Info */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{t("แผนที่", "Map")}</CardTitle>
            </CardHeader>
            <CardContent>
              {settings?.mapUrl ? (
                <div className="rounded-lg overflow-hidden h-96 relative">
                  {settings.mapUrl.includes('<iframe') ? (
                    // If mapUrl contains iframe HTML, render it safely with sanitization
                    <SafeIframe
                      html={settings.mapUrl.replace(
                        /<iframe/g,
                        '<iframe style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"'
                      )}
                      className="w-full h-full"
                      allowedSources={["google.com/maps", "google.com/maps/embed"]}
                    />
                  ) : (
                    // If mapUrl is just a URL, use iframe
                    <iframe
                      src={settings.mapUrl}
                      className="absolute top-0 left-0 w-full h-full"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Map Location"
                    />
                  )}
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                  <p className="text-muted-foreground text-center px-4">
                    {t(
                      "กรุณาตั้งค่า Google Maps URL ในหน้า Admin Settings",
                      "Please configure Google Maps URL in Admin Settings"
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
