"use client";

import { useState, useEffect, Suspense } from "react";

import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Course, Category, Institution, CourseType, CourseWithRelations } from "@/lib/types";
import { Search } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { getIconComponent } from "@/lib/icon-map";
import { Pagination } from "@/components/pagination";
import { CourseCard } from "@/components/course-card";
import { VideoModal } from "@/components/video-modal";

interface CoursesPageClientProps {
    initialCourses: CourseWithRelations[];
    categories: Category[];
    institutions: Institution[];
    courseTypes: CourseType[];
}

function CoursesPageContent({
    initialCourses,
    categories,
    institutions,
    courseTypes,
}: CoursesPageClientProps) {
    const { language, t } = useLanguage();
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get("category");
    const institutionParam = searchParams.get("institution");
    const searchParam = searchParams.get("search");

    // Use initial data passed from server
    const [allCourses] = useState<CourseWithRelations[]>(initialCourses);
    const [filteredCourses, setFilteredCourses] = useState<CourseWithRelations[]>(initialCourses);

    const [searchQuery, setSearchQuery] = useState(searchParam || "");
    const [selectedCategory, setSelectedCategory] = useState(categoryParam || "");
    const [selectedInstitution, setSelectedInstitution] = useState(institutionParam || "");
    const [selectedCourseType, setSelectedCourseType] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);
    const ITEMS_PER_PAGE = 30;

    const handlePlayVideo = (url: string, title: string) => {
        setActiveVideo({ url, title });
    };

    // Update filters when URL params change
    useEffect(() => {
        setSelectedCategory(categoryParam || "");
        setSelectedInstitution(institutionParam || "");
        if (searchParam) {
            setSearchQuery(searchParam);
        }
    }, [categoryParam, institutionParam, searchParam]);

    useEffect(() => {
        let filtered = [...allCourses];

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (course) =>
                    course.title.toLowerCase().includes(query) ||
                    course.titleEn.toLowerCase().includes(query) ||
                    course.description.toLowerCase().includes(query)
            );
        }

        // Filter by category
        if (selectedCategory) {
            filtered = filtered.filter(
                (course) => {
                    const categories = course.courseCategories || course.course_categories || [];
                    return categories.some((cc) => cc.categoryId === selectedCategory);
                }
            );
        }

        // Filter by institution
        if (selectedInstitution) {
            filtered = filtered.filter(
                (course) => course.institutionId === selectedInstitution
            );
        }

        // Filter by course type
        if (selectedCourseType) {
            filtered = filtered.filter(
                (course) => {
                    const types = course.courseCourseTypes || course.course_course_types || [];
                    return types.some((ct) => ct.courseTypeId === selectedCourseType);
                }
            );
        }

        setFilteredCourses(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    }, [searchQuery, selectedCategory, selectedInstitution, selectedCourseType, allCourses]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Filters */}
                <aside className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("ค้นหาและกรองรายวิชา", "Search & Filter")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Search */}
                            <div>
                                <Label htmlFor="search">
                                    {t("ค้นหาชื่อรายวิชา", "Search Course Title")}
                                </Label>
                                <div className="relative mt-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder={t("ค้นหา...", "Search...")}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <Label>
                                    {t("หมวดหมู่", "Category")}
                                </Label>
                                <div className="mt-2 space-y-1">
                                    <button
                                        onClick={() => setSelectedCategory("")}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${selectedCategory === ""
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-accent"
                                            }`}
                                    >
                                        {t("ทั้งหมด", "All")}
                                    </button>
                                    {categories?.map((cat) => {
                                        const IconComponent = getIconComponent(cat.icon);
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => setSelectedCategory(cat.id)}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${selectedCategory === cat.id
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-accent"
                                                    }`}
                                            >
                                                <IconComponent className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">
                                                    {language === "th" ? cat.name : cat.nameEn}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Institution Filter */}
                            <div>
                                <Label htmlFor="institution">
                                    {t("สถาบันการศึกษา", "Institution")}
                                </Label>
                                <Select
                                    value={selectedInstitution || "all"}
                                    onValueChange={(value) => setSelectedInstitution(value === "all" ? "" : value)}
                                >
                                    <SelectTrigger className="mt-2">
                                        <SelectValue placeholder={t("ทั้งหมด", "All")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("ทั้งหมด", "All")}</SelectItem>
                                        {institutions?.map((inst) => (
                                            <SelectItem key={inst.id} value={inst.id}>
                                                {language === "th" ? inst.name : inst.nameEn}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Course Type Filter */}
                            <div>
                                <Label>
                                    {t("ประเภทรายวิชา", "Course Type")}
                                </Label>
                                <div className="mt-2 space-y-1">
                                    <button
                                        onClick={() => setSelectedCourseType("")}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${selectedCourseType === ""
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-accent"
                                            }`}
                                    >
                                        {t("ทั้งหมด", "All")}
                                    </button>
                                    {courseTypes?.map((type) => {
                                        const IconComponent = getIconComponent(type.icon || "BookOpen");
                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => setSelectedCourseType(type.id)}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${selectedCourseType === type.id
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-accent"
                                                    }`}
                                            >
                                                <IconComponent className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">
                                                    {language === "th" ? type.name : type.nameEn}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Clear Filters */}
                            {(searchQuery || selectedCategory || selectedInstitution || selectedCourseType) && (
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedCategory("");
                                        setSelectedInstitution("");
                                        setSelectedCourseType("");
                                    }}
                                    className="text-sm text-primary hover:underline"
                                >
                                    {t("ล้างตัวกรอง", "Clear Filters")}
                                </button>
                            )}
                        </CardContent>
                    </Card>
                </aside>

                {/* Course Grid */}
                <div className="lg:col-span-3">
                    <VideoModal
                        isOpen={!!activeVideo}
                        onClose={() => setActiveVideo(null)}
                        videoUrl={activeVideo?.url || null}
                        title={activeVideo?.title}
                    />

                    <div className="mb-4 text-sm text-muted-foreground">
                        {filteredCourses.length > 0 ? t(
                            `แสดง ${startIndex + 1}-${Math.min(endIndex, filteredCourses.length)} จาก ${filteredCourses.length} คอร์ส`,
                            `Showing ${startIndex + 1}-${Math.min(endIndex, filteredCourses.length)} of ${filteredCourses.length} courses`
                        ) : t(
                            `แสดง 0 คอร์ส`,
                            `Showing 0 courses`
                        )}
                    </div>

                    {filteredCourses.length === 0 ? (
                        <Card className="p-12 text-center">
                            <p className="text-lg text-muted-foreground">
                                {t(
                                    "ไม่พบคอร์สที่ตรงกับเงื่อนไขการค้นหา",
                                    "No courses found matching your criteria"
                                )}
                            </p>
                        </Card>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginatedCourses?.map((course) => (
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

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                translations={{
                                    previous: t("ก่อนหน้า", "Previous"),
                                    next: t("ถัดไป", "Next"),
                                    pageOf: (current, total) => t(`หน้า ${current} จาก ${total}`, `Page ${current} of ${total}`)
                                }}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CoursesPageClient(props: CoursesPageClientProps) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <CoursesPageContent {...props} />
        </Suspense>
    );
}
