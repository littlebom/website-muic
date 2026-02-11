"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/safe-image";
import { Play, BookOpen } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { getIconComponent } from "@/lib/icon-map";
import type { CourseWithRelations, Category, Institution, CourseType } from "@/lib/types";

interface CourseCardProps {
    course: CourseWithRelations;
    language: "th" | "en";
    institutions: Institution[];
    courseTypes?: CourseType[];
    categories?: Category[];
    onPlayVideo?: (url: string, title: string) => void;
}

export function CourseCard({
    course,
    language,
    institutions,
    courseTypes = [],
    categories = [],
    onPlayVideo,
}: CourseCardProps) {
    const institution = institutions?.find(inst => inst.id === course.institutionId);
    const courseCategories = course.courseCategories || course.course_categories || [];
    const categoryNames = courseCategories
        .map((cc) => {
            const category = categories?.find(c => c.id === cc.categoryId);
            return category ? (language === "th" ? category.name : category.nameEn) : null;
        })
        .filter(Boolean)
        .join(", ");

    return (
        <Link href={`/courses/${(course as any).courseCode || course.id}`} className="block h-full">

            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col group relative overflow-hidden bg-gradient-to-br from-white via-white to-primary/10 border-slate-100 rounded-[5px] p-0 hover:-translate-y-1">
                {/* Decorative Diagonal Stripe */}
                <div className="absolute -bottom-20 -right-24 w-48 h-[30px] bg-primary/20 rotate-45 pointer-events-none transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2 z-0" />
                <div className="relative h-44 w-full overflow-hidden z-10 rounded-t-[5px]">
                    <SafeImage
                        src={getImageUrl(course.imageId)}
                        alt={language === "th" ? course.title : course.titleEn}
                        fill
                        className="object-cover rounded-t-lg transition-transform duration-300 group-hover:scale-105"
                        fallbackType="course"
                    />

                    {/* Play Button Overlay */}
                    {course.videoUrl && onPlayVideo && (
                        <div
                            className="absolute inset-0 flex items-center justify-center bg-slate-900/30 group-hover:bg-slate-900/10 transition-colors duration-300 z-10"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onPlayVideo(course.videoUrl!, language === "th" ? course.title : course.titleEn);
                            }}
                        >
                            <div className="relative group/play">
                                {/* Outer Glow */}
                                <div className="absolute inset-0 rounded-full bg-white/30 blur-md scale-150 group-hover/play:scale-175 transition-all duration-500" />
                                {/* Icon Only */}
                                <div className="relative text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] transform transition-all duration-300 group-hover/play:scale-110 group-hover/play:text-white border-2 border-white/30 group-hover/play:border-white rounded-full p-1.5">
                                    <Play className="w-6 h-6 fill-current stroke-0 ml-0.5" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Course Type Icons */}
                    {(course.courseCourseTypes || course.course_course_types) &&
                        (course.courseCourseTypes || course.course_course_types)!.length > 0 &&
                        courseTypes.length > 0 && (() => {
                            const types = course.courseCourseTypes || course.course_course_types || [];
                            const courseTypesToShow = types.slice(0, 3);
                            const icons = courseTypesToShow.map((ct) => {
                                const courseType = courseTypes.find(t => t.id === ct.courseTypeId);
                                if (!courseType || !courseType.icon) return null;
                                const IconComponent = getIconComponent(courseType.icon);
                                return { IconComponent, name: language === "th" ? courseType.name : courseType.nameEn };
                            }).filter(Boolean);

                            if (icons.length === 0) return null;

                            return (
                                <div className="absolute top-3 right-3 flex gap-1.5 z-20">
                                    {icons.map((item, index) => {
                                        const Icon = item!.IconComponent;
                                        return (
                                            <div
                                                key={index}
                                                className="bg-black/20 backdrop-blur-md text-white border border-white/20 rounded-full p-2 flex items-center justify-center shadow-sm"
                                                title={item!.name}
                                            >
                                                <Icon className="h-3.5 w-3.5" />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                </div>
                <CardHeader className="flex-grow px-4 py-4 relative z-10">
                    <CardTitle className="line-clamp-2 text-base font-bold mb-2 text-slate-700 group-hover:text-primary transition-colors duration-300">
                        {language === "th" ? course.title : course.titleEn}
                    </CardTitle>
                    {institution && (
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                            <p className="text-xs text-muted-foreground line-clamp-1">
                                {language === "th" ? institution.name : institution.nameEn}
                            </p>
                        </div>
                    )}
                    {categoryNames && (
                        <p className="text-xs text-muted-foreground/80 line-clamp-1 pl-3.5">
                            {categoryNames}
                        </p>
                    )}
                </CardHeader>
                <CardContent className="mt-auto px-4 pb-4 relative z-10">
                    <div className="flex items-center justify-between text-xs pt-2">
                        <Badge variant="secondary" className="font-medium bg-primary text-white hover:bg-white hover:text-primary transition-colors duration-300 shadow-sm border border-transparent hover:border-primary/20 rounded-[5px]">{course.level}</Badge>
                        <span className="text-primary flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-[5px] text-[11px] font-medium hover:bg-slate-200 transition-colors duration-300 cursor-default">
                            {course.durationHours}{" "}
                            {language === "th" ? "ชม." : "hrs"}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
