"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { SafeImage } from "@/components/safe-image";
import { CourseCard } from "@/components/course-card";
import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Category, News, Banner, Institution, CourseType, CourseWithRelations } from "@/lib/types";
import { VideoModal } from "@/components/video-modal";
import { ArrowRight, SquarePlus, ArrowUpSquare, Users, Award, Building2 } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { getIconComponent } from "@/lib/icon-map";
import { BannerDisplay } from "@/components/public/banner-display";
import { PopupModal } from "@/components/public/popup-modal";
import { HomeSearchBox } from "@/components/public/home-search-box";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface HomePageClientProps {
    categories: Category[];
    newCourses: CourseWithRelations[];
    popularCourses: CourseWithRelations[];
    news: News[];
    banners: Banner[];
    institutions: Institution[];
    courseTypes: CourseType[];
}

interface StatsData {
    courses: number;
    externalLearners: number;
    certificates: number;
    institutions: number;
}

export default function HomePageClient({
    categories,
    newCourses,
    popularCourses,
    news,
    banners,
    institutions,
    courseTypes,
}: HomePageClientProps) {
    const { language, t } = useLanguage();
    const [currentBanner, setCurrentBanner] = useState(0);
    const [stats, setStats] = useState<StatsData | null>(null);
    const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch("/api/public/stats");
                const data = await response.json();
                if (data.success) {
                    setStats(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            }
        }
        fetchStats();
    }, []);

    const handlePlayVideo = (url: string, title: string) => {
        setActiveVideo({ url, title });
    };

    return (
        <div className="min-h-screen">
            {/* Popup Modal */}
            <PopupModal language={language} />

            {/* Video Modal */}
            <VideoModal
                isOpen={!!activeVideo}
                onClose={() => setActiveVideo(null)}
                videoUrl={activeVideo?.url || null}
                title={activeVideo?.title}
            />

            {/* Hero Carousel */}
            <BannerDisplay banners={banners} language={language} />



            {/* Browse by Category - Solid Brand Color */}
            <section className="container mx-auto px-4 py-12">
                <h2 className="text-[1.2rem] font-bold mb-8 mt-8">
                    {t("หมวดหมู่รายวิชา", "Browse by Category")}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categories.map((category) => {
                        const IconComponent = getIconComponent(category.icon);
                        return (
                            <Link key={category.id} href={`/courses?category=${category.id}`}>
                                <div className="group relative flex items-center gap-4 bg-white border border-slate-100 rounded-[5px] p-4 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer h-full overflow-hidden">
                                    {/* Blue Accent Bar on Hover */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                    <div className="w-12 h-12 shrink-0 rounded-lg bg-blue-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                        <IconComponent className="w-6 h-6" strokeWidth={1.5} />
                                    </div>

                                    <h3 className="font-semibold text-slate-700 text-sm md:text-base group-hover:text-primary transition-colors duration-300 line-clamp-2">
                                        {language === "th" ? category.name : category.nameEn}
                                    </h3>

                                    {/* Decorative Background Icon */}
                                    <IconComponent className="absolute -right-6 -bottom-6 w-24 h-24 text-yellow-500/20 opacity-0 group-hover:opacity-100 group-hover:-translate-x-4 group-hover:-translate-y-4 transition-all duration-500 pointer-events-none rotate-[-15deg]" strokeWidth={1.5} />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* New Courses */}
            {/* New Courses */}
            <section className="w-full bg-primary/5 py-12">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <SquarePlus className="h-6 w-6 text-primary" />
                            <h2 className="text-[1.2rem] font-bold">
                                {t("รายวิชาใหม่", "New Courses")}
                            </h2>
                        </div>
                        <Button asChild variant="default" size="sm" style={{ borderRadius: '5px' }}>
                            <Link href="/courses">
                                {t("ดูทั้งหมด", "View All")}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {newCourses.map((course) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                language={language}
                                institutions={institutions}
                                courseTypes={courseTypes}
                                categories={categories}
                                onPlayVideo={handlePlayVideo}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Popular Courses */}
            <section className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <ArrowUpSquare className="h-6 w-6 text-primary" />
                        <h2 className="text-[1.2rem] font-bold">
                            {t("รายวิชาได้รับความนิยมสูงสุด", "Popular Courses")}
                        </h2>
                    </div>
                    <Button asChild variant="default" size="sm" style={{ borderRadius: '5px' }}>
                        <Link href="/courses">
                            {t("ดูทั้งหมด", "View All")}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {popularCourses.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            language={language}
                            institutions={institutions}
                            courseTypes={courseTypes}
                            categories={categories}
                            onPlayVideo={handlePlayVideo}
                        />
                    ))}
                </div>
            </section>

            {/* News & Announcements */}
            {/* News & Announcements */}
            <section className="w-full bg-primary/5 py-12">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-[1.2rem] font-bold">
                            {t("ข่าวประชาสัมพันธ์", "News & Announcements")}
                        </h2>
                        <Button asChild variant="default" size="sm" style={{ borderRadius: '5px' }}>
                            <Link href="/news">
                                {t("ดูทั้งหมด", "View All")}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {news.map((item) => (
                            <Link key={item.id} href={`/news/${item.id}`} className="block h-full">
                                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col group relative overflow-hidden bg-gradient-to-br from-white via-white to-primary/10 border-slate-100 rounded-[5px] p-0 hover:-translate-y-1">
                                    {/* Decorative Diagonal Stripe */}
                                    <div className="absolute -bottom-20 -right-24 w-48 h-[30px] bg-primary/20 rotate-45 pointer-events-none transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2 z-0" />
                                    <div className="relative h-40 w-full overflow-hidden z-10 rounded-t-[5px]">
                                        <SafeImage
                                            src={getImageUrl(item.imageId)}
                                            alt={item.title}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            fallbackType="news"
                                        />
                                    </div>
                                    <CardHeader className="flex-grow relative z-10">
                                        <CardTitle className="line-clamp-2 text-base group-hover:text-primary transition-colors duration-300">{item.title}</CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(item.createdAt).toLocaleDateString(
                                                language === "th" ? "th-TH" : "en-US"
                                            )}
                                        </p>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}


