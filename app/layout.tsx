import { Sarabun } from "next/font/google";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Preloader } from "@/components/preloader";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "Thai MOOC - แพลตฟอร์มการเรียนรู้ออนไลน์",
  description: "แพลตฟอร์มการเรียนรู้ออนไลน์สำหรับคนไทย",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

import { SettingsProvider } from "@/components/providers/settings-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sarabun.variable}`} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <SettingsProvider>
          <Preloader />
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
