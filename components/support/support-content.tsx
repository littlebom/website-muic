"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, HelpCircle, FileText, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

interface Guide {
    id: string;
    title: string;
    category: string;
    view_count: number;
    created_at: string;
    updated_at: string;
}

interface SupportContentProps {
    guides: Guide[];
    categories: string[];
}

export function SupportContent({ guides, categories }: SupportContentProps) {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-[hsl(242.32deg_46.24%_31.23%)] to-[#2f436f] text-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
                            <HelpCircle className="w-10 h-10" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            {t("ศูนย์ช่วยเหลือและสนับสนุน", "Help & Support Center")}
                        </h1>
                        <p className="text-xl text-blue-100 mb-8">
                            {t("ค้นหาคำตอบและคู่มือการใช้งานระบบ Thai MOOC", "Find answers and user guides for Thai MOOC")}
                        </p>
                        {/* Search Bar */}
                        <div className="relative max-w-2xl mx-auto">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={t(
                                    "ค้นหาคำถาม เช่น วิธีการลงทะเบียนเรียน, รีเซ็ตรหัสผ่าน...",
                                    "Search for questions like registration, password reset..."
                                )}
                                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="container mx-auto px-4 -mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    <Link href="/support/ticket">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <MessageSquare className="w-6 h-6 text-primary" />
                                    </div>
                                    <CardTitle className="text-lg">
                                        {t("แจ้งปัญหา", "Report Issue")}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    {t(
                                        "ขอความช่วยเหลือเมื่อพบปัญหาในการใช้งาน",
                                        "Get help with usage issues"
                                    )}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/support/track">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <Search className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <CardTitle className="text-lg">
                                        {t("ติดตามสถานะ", "Track Status")}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    {t(
                                        "ตรวจสอบสถานะคำขอความช่วยเหลือของคุณ",
                                        "Check your ticket status"
                                    )}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/contact">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <HelpCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <CardTitle className="text-lg">
                                        {t("ติดต่อเรา", "Contact Us")}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    {t(
                                        "ช่องทางการติดต่อและสอบถามข้อมูลเพิ่มเติม",
                                        "Contact channels and more info"
                                    )}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>

            {/* Guides Section */}
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <BookOpen className="w-8 h-8 text-primary" />
                        <h2 className="text-3xl font-bold text-gray-900">
                            {t("คู่มือการใช้งาน", "User Guides")}
                        </h2>
                    </div>

                    {guides.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">
                                    {t("ยังไม่มีคู่มือการใช้งาน", "No user guides available yet")}
                                </p>
                                <p className="text-gray-400 text-sm mt-2">
                                    {t("กำลังเตรียมเนื้อหาให้คุณ โปรดกลับมาตรวจสอบในภายหลัง", "Content is being prepared, please check back later")}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-8">
                            {categories.map((category) => {
                                const categoryGuides = guides.filter(
                                    (g) => (g.category || "ทั่วไป") === category
                                );

                                return (
                                    <div key={category}>
                                        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <div className="w-2 h-6 bg-primary rounded"></div>
                                            {category}
                                            <span className="text-sm text-gray-500 font-normal">
                                                ({categoryGuides.length} {t("คู่มือ", "Guides")})
                                            </span>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {categoryGuides.map((guide) => (
                                                <Link key={guide.id} href={`/support/guides/${guide.id}`}>
                                                    <Card className="hover:shadow-md transition-all hover:border-primary cursor-pointer h-full">
                                                        <CardHeader>
                                                            <CardTitle className="text-lg flex items-start gap-2">
                                                                <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                                                                <span className="flex-1">{guide.title}</span>
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Search className="w-3 h-3" />
                                                                    {t("เข้าชม", "Views")} {guide.view_count || 0} {t("ครั้ง", "times")}
                                                                </span>
                                                                <span>
                                                                    {t("อัพเดท", "Updated")} {new Date(guide.updated_at).toLocaleDateString(t("th-TH", "en-US"))}
                                                                </span>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white border-t">
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            {t("ยังหาคำตอบที่ต้องการไม่พบใช่หรือไม่?", "Still can't find what you're looking for?")}
                        </h2>
                        <p className="text-gray-600 mb-8">
                            {t("ทีมงานของเรายินดีให้ความช่วยเหลือ", "Our team is here to help")}
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link href="/support/ticket">
                                <Button size="lg" className="gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    {t("แจ้งปัญหา", "Report Issue")}
                                </Button>
                            </Link>
                            <Link href="/contact">
                                <Button size="lg" variant="outline" className="gap-2">
                                    <HelpCircle className="w-5 h-5" />
                                    {t("ติดต่อเรา", "Contact Us")}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
