"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getImagePlaceholder } from "@/lib/data";
import { CourseSkillCard } from "@/components/course/course-skill-card";
import type { CourseWithRelations, Category, Instructor, Institution } from "@/lib/types";
import { VideoModal } from "@/components/video-modal";
import {
    Eye,
    Clock,
    Award,
    BarChart,
    Globe,
    Calendar,
    Users,
    BookOpen,
    Target,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Facebook,
    Twitter,
    Instagram,
    Play,
    Library,
} from "lucide-react";

interface CourseDetailsPageClientProps {
    course: CourseWithRelations;
    category: Category | null;
    instructors: Instructor[];
    institution: Institution | null;
    categories: Category[];
}

export default function CourseDetailsPageClient({
    course,
    category,
    instructors,
    institution,
    categories,
}: CourseDetailsPageClientProps) {
    const { language, t } = useLanguage();
    const [activeTab, setActiveTab] = useState<"description" | "content" | "skills">("description");
    const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
    const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);

    // Increment view count on mount
    useEffect(() => {
        fetch(`/api/courses/${course.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                enrollCount: (course.enrollCount || 0) + 1,
            }),
        }).catch(err => console.error("Failed to increment view count:", err));
    }, [course.id, course.enrollCount]);

    // Update meta tags for social sharing
    useEffect(() => {
        const courseTitle = language === "th" ? course.title : course.titleEn;
        const courseImage = getCourseImageUrl();
        const currentUrl = typeof window !== "undefined" ? window.location.href : "";

        // Update document title
        document.title = `${courseTitle} - Thai MOOC`;

        // Helper function to update or create meta tag
        const updateMetaTag = (selector: string, attribute: string, content: string) => {
            let element = document.querySelector(selector);
            if (!element) {
                element = document.createElement('meta');
                if (selector.includes('property=')) {
                    element.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
                } else {
                    element.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
                }
                document.head.appendChild(element);
            }
            element.setAttribute(attribute, content);
        };

        // Update meta tags
        updateMetaTag('meta[name="description"]', 'content', course.description);

        // Open Graph tags
        updateMetaTag('meta[property="og:type"]', 'content', 'website');
        updateMetaTag('meta[property="og:url"]', 'content', currentUrl);
        updateMetaTag('meta[property="og:title"]', 'content', courseTitle);
        updateMetaTag('meta[property="og:description"]', 'content', course.description);
        updateMetaTag('meta[property="og:image"]', 'content', courseImage);
        updateMetaTag('meta[property="og:image:width"]', 'content', '1200');
        updateMetaTag('meta[property="og:image:height"]', 'content', '630');
        updateMetaTag('meta[property="og:site_name"]', 'content', 'Thai MOOC');

        // Twitter Card tags
        updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
        updateMetaTag('meta[name="twitter:url"]', 'content', currentUrl);
        updateMetaTag('meta[name="twitter:title"]', 'content', courseTitle);
        updateMetaTag('meta[name="twitter:description"]', 'content', course.description);
        updateMetaTag('meta[name="twitter:image"]', 'content', courseImage);
    }, [course, language]);

    // Get course image URL - support both URL and placeholder ID
    const getCourseImageUrl = () => {
        if (!course?.imageId) return '/placeholder.png';
        if (course.imageId.startsWith('http://') || course.imageId.startsWith('https://') || course.imageId.startsWith('/')) {
            return course.imageId;
        }
        const placeholder = getImagePlaceholder(course.imageId);
        return placeholder?.url || '/placeholder.png';
    };

    // Get instructor image URL - support both URL and placeholder ID
    const getInstructorImageUrl = (imageUrl?: string | null) => {
        if (!imageUrl) return '/placeholder.png';
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/')) {
            return imageUrl;
        }
        const placeholder = getImagePlaceholder(imageUrl);
        return placeholder?.url || '/placeholder.png';
    };

    const toggleTopic = (topicId: string) => {
        const newExpanded = new Set(expandedTopics);
        if (newExpanded.has(topicId)) {
            newExpanded.delete(topicId);
        } else {
            newExpanded.add(topicId);
        }
        setExpandedTopics(newExpanded);
    };

    const getLevelLabel = (level: string | null | undefined) => {
        if (!level) return language === "th" ? "ไม่ระบุ" : "Not specified";

        const lowerLevel = level.toLowerCase();
        const labels: Record<string, { th: string, en: string }> = {
            beginner: { th: "เบื้องต้น", en: "Beginner" },
            intermediate: { th: "ปานกลาง", en: "Intermediate" },
            advanced: { th: "ขั้นสูง", en: "Advanced" },
        };

        const match = labels[lowerLevel];
        if (match) {
            return language === "th" ? match.th : match.en;
        }

        return level;
    };

    const getLanguageLabel = (lang: string) => {
        if (!lang) return language === "th" ? "ไม่ระบุ" : "Not specified";

        const lowerLang = lang.toLowerCase().trim();

        // Thai variations
        if (['th', 'thai', 'thailand', 'ภาษาไทย', 'ไทย'].includes(lowerLang)) {
            return language === "th" ? "ภาษาไทย" : "Thai";
        }

        // English variations
        if (['en', 'eng', 'english', 'usa', 'uk', 'ภาษาอังกฤษ', 'อังกฤษ'].includes(lowerLang)) {
            return language === "th" ? "ภาษาอังกฤษ" : "English";
        }

        // Return original if no match (e.g. "Thai/English")
        return lang;
    };

    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareTitle = course ? (language === "th" ? course.title : course.titleEn) : "";

    // Parse and clean learning outcomes
    const parseLearningOutcomes = (outcomes: string | string[] | null | undefined): string[] => {
        if (!outcomes) return [];

        let parsed: string | string[];

        // 1. Try to parse JSON if it's a string
        if (typeof outcomes === 'string') {
            try {
                parsed = JSON.parse(outcomes);
            } catch {
                parsed = [outcomes];
            }
        } else {
            parsed = outcomes;
        }

        // 2. Normalize to array
        const outcomeArray = Array.isArray(parsed) ? parsed : [parsed];

        // 3. Deep cleaning (Handle HTML tags and numbered lists)
        if (outcomeArray.length === 1 && typeof outcomeArray[0] === 'string') {
            const rawStr = outcomeArray[0];

            if (rawStr.includes('<li>')) {
                return rawStr
                    .split('<li>')
                    .map(item => item.replace(/<\/?[^>]+(>|$)/g, "").trim())
                    .filter(item => item.length > 0);
            }

            if (/^1\./.test(rawStr.trim())) {
                return rawStr
                    .split(/\d+\.\s+/)
                    .map(item => item.trim())
                    .filter(item => item.length > 0);
            }
        }

        return outcomeArray;
    };

    const learningOutcomes = parseLearningOutcomes(course.learningOutcomes);

    const contentStructure = course.contentStructure
        ? (typeof course.contentStructure === 'string'
            ? JSON.parse(course.contentStructure)
            : course.contentStructure)
        : [];

    const tags = course.tags
        ? (typeof course.tags === 'string'
            ? course.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)
            : course.tags)
        : [];

    return (
        <div className="min-h-screen bg-gray-50">
            <VideoModal
                isOpen={!!activeVideo}
                onClose={() => setActiveVideo(null)}
                videoUrl={activeVideo?.url || null}
                title={activeVideo?.title}
            />
            {/* Hero Section */}
            <section className="bg-white border-b">
                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Course Info */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                {category && (
                                    <Badge variant="secondary" className="text-sm">
                                        {language === "th" ? category.name : category.nameEn}
                                    </Badge>
                                )}
                                <Badge variant="outline" className="text-sm">
                                    {getLevelLabel(course.level)}
                                </Badge>
                            </div>

                            <h1 className="text-3xl md:text-4xl font-bold mb-4">
                                {language === "th" ? course.title : course.titleEn}
                            </h1>

                            {institution && (
                                <p className="text-lg text-muted-foreground mb-2">
                                    {language === "th" ? institution.name : institution.nameEn}
                                </p>
                            )}

                            {(() => {
                                const courseCategories = course.courseCategories || course.course_categories || [];
                                const categoryNames = courseCategories
                                    .map((cc) => {
                                        const cat = categories.find(c => c.id === cc.categoryId);
                                        return cat ? (language === "th" ? cat.name : cat.nameEn) : null;
                                    })
                                    .filter(Boolean)
                                    .join(", ");

                                if (!categoryNames) return null;

                                return (
                                    <p className="text-sm text-muted-foreground mb-6">
                                        {categoryNames}
                                    </p>
                                );
                            })()}

                            {/* Quick Stats */}
                            <div className="flex flex-wrap gap-4 mb-6">
                                <div className="flex items-center gap-2 text-sm">
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                    <span>{(course.enrollCount || 0).toLocaleString()} {t("ครั้ง", "views")}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{course.durationHours} {t("ชั่วโมง", "hours")}</span>
                                </div>
                                {course.hasCertificate && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Award className="h-4 w-4 text-muted-foreground" />
                                        <span>{t("มีใบรับรอง", "Certificate")}</span>
                                    </div>
                                )}
                            </div>

                            {/* CTA Button */}
                            <Button asChild size="lg" className="w-full md:w-auto" style={{ borderRadius: '9px' }}>
                                <a href={course.courseUrl || '#'} target="_blank" rel="noopener noreferrer">
                                    {t("ไปยังคอร์สเรียน", "Go to Course")}
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </div>

                        {/* Course Image */}
                        <div className="lg:col-span-1">
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg group">
                                <SafeImage
                                    src={getCourseImageUrl()}
                                    alt={language === "th" ? course.title : course.titleEn}
                                    fill
                                    className="object-cover"
                                    priority
                                    fallbackType="course"
                                />
                                {/* Video Play Button */}
                                {course.videoUrl && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                                        <button
                                            onClick={() => setActiveVideo({ url: course.videoUrl!, title: language === "th" ? course.title : course.titleEn })}
                                            className="w-20 h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all hover:scale-110"
                                            aria-label={t("เล่นวิดีโอ", "Play Video")}
                                        >
                                            <Play className="h-10 w-10 text-primary ml-1" fill="currentColor" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Course Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tabs */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex border-b">
                                    <button
                                        onClick={() => setActiveTab("description")}
                                        className={`px-4 py-2 font-semibold transition-colors ${activeTab === "description"
                                            ? "border-b-2 border-primary text-primary"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {t("รายละเอียดคอร์ส", "Course Description")}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("content")}
                                        className={`px-4 py-2 font-semibold transition-colors ${activeTab === "content"
                                            ? "border-b-2 border-primary text-primary"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {t("โครงสร้างเนื้อหา", "Course Content")}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("skills")}
                                        className={`px-4 py-2 font-semibold transition-colors ${activeTab === "skills"
                                            ? "border-b-2 border-primary text-primary"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {t("ทักษะที่ได้รับ", "Course Skills")}
                                    </button>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-6">
                                {activeTab === "description" ? (
                                    <div className="space-y-6">
                                        {/* Long Description */}
                                        <div>
                                            <h3 className="text-xl font-semibold mb-3">
                                                {t("เกี่ยวกับคอร์สนี้", "About This Course")}
                                            </h3>
                                            <p className="text-muted-foreground leading-relaxed">
                                                {(course as any).longDescription || course.description}
                                            </p>
                                        </div>

                                        {/* Learning Outcomes */}
                                        <div>
                                            <h3 className="text-xl font-semibold mb-3">
                                                {t("ผลลัพธ์การเรียนรู้", "Learning Outcomes")}
                                            </h3>
                                            <ul className="space-y-2">
                                                {learningOutcomes.map((outcome: string, index: number) => (
                                                    <li key={index} className="flex items-start gap-2">
                                                        <span className="text-primary mt-1">•</span>
                                                        <span className="text-muted-foreground">{outcome}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ) : activeTab === "content" ? (
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-semibold mb-4">
                                            {t("โครงสร้างเนื้อหา", "Content Structure")}
                                        </h3>
                                        {contentStructure.map((topic: any, index: number) => (
                                            <div key={topic.id} className="border rounded-lg">
                                                <button
                                                    onClick={() => toggleTopic(topic.id)}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-semibold text-primary">
                                                            {index + 1}
                                                        </span>
                                                        <span className="font-semibold text-left">
                                                            {topic.title}
                                                        </span>
                                                    </div>
                                                    {expandedTopics.has(topic.id) ? (
                                                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </button>
                                                {expandedTopics.has(topic.id) && (
                                                    <div className="px-4 pb-4 border-t bg-gray-50">
                                                        <ul className="space-y-2 mt-4">
                                                            {(topic.subtopics || []).map((subtopic: string, subIndex: number) => (
                                                                <li
                                                                    key={subIndex}
                                                                    className="flex items-start gap-2 text-sm"
                                                                >
                                                                    <span className="text-muted-foreground mt-1">
                                                                        -
                                                                    </span>
                                                                    <span className="text-muted-foreground">
                                                                        {subtopic}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div>
                                        <CourseSkillCard courseId={course.id} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Instructor Card */}
                        {instructors.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        {t("ผู้สอน", instructors.length > 1 ? "Instructors" : "Instructor")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className={instructors.length > 1 ? "grid grid-cols-2 gap-4" : ""}>
                                        {instructors.map((instructor) => (
                                            <div key={instructor.id} className="flex items-center gap-4 mb-4 last:mb-0">
                                                <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                                                    <SafeImage
                                                        src={getInstructorImageUrl(instructor.imageUrl)}
                                                        alt={instructor.name}
                                                        fill
                                                        className="object-cover"
                                                        fallbackType="instructor"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold truncate">
                                                        {language === "th" ? instructor.name : instructor.nameEn}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {instructor.title}
                                                    </p>
                                                    {instructor.email && (
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {instructor.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Tags */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {t("แท็ก", "Tags")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag: string) => (
                                        <Badge key={tag} variant="secondary">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Course Overview */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {t("ภาพรวมคอร์ส", "Course Overview")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-5 w-5 text-muted-foreground" />
                                        <p className="text-sm font-medium">
                                            {t("จำนวนผู้เข้าชม", "View Count")}
                                        </p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {(course.enrollCount || 0).toLocaleString()} {t("ครั้ง", "times")}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Library className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                        <p className="text-sm font-medium">
                                            {t("หมวดหมู่รายวิชา", "Category")}
                                        </p>
                                    </div>
                                    <p className="text-sm text-muted-foreground text-right">
                                        {(() => {
                                            // Try courseCategories first
                                            const courseCategories = course.courseCategories || course.course_categories || [];
                                            if (courseCategories.length > 0) {
                                                const categoryNames = courseCategories
                                                    .map((cc) => {
                                                        const cat = categories.find(c => c.id === cc.categoryId);
                                                        return cat ? (language === "th" ? cat.name : cat.nameEn) : null;
                                                    })
                                                    .filter(Boolean)
                                                    .join(", ");
                                                if (categoryNames) return categoryNames;
                                            }

                                            // Fallback to categoryIds
                                            const categoryIds = course.categoryIds || [];
                                            if (categoryIds.length > 0) {
                                                const categoryNames = categoryIds
                                                    .map((id: string) => {
                                                        const cat = categories.find(c => c.id === id);
                                                        return cat ? (language === "th" ? cat.name : cat.nameEn) : null;
                                                    })
                                                    .filter(Boolean)
                                                    .join(", ");
                                                if (categoryNames) return categoryNames;
                                            }

                                            return t("ไม่ระบุ", "Not specified");
                                        })()}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <BarChart className="h-5 w-5 text-muted-foreground" />
                                        <p className="text-sm font-medium">
                                            {t("ระดับ", "Level")}
                                        </p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {getLevelLabel(course.level)}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-muted-foreground" />
                                        <p className="text-sm font-medium">
                                            {t("ภาษา", "Language")}
                                        </p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {getLanguageLabel(course.teachingLanguage || 'th')}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                        <p className="text-sm font-medium">
                                            {t("ระยะเวลา", "Duration")}
                                        </p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {course.durationHours} {t("ชั่วโมง", "hours")}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-muted-foreground" />
                                        <p className="text-sm font-medium">
                                            {t("ปีที่พัฒนา", "Development Year")}
                                        </p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {(() => {
                                            const year = course.developmentYear || new Date().getFullYear();
                                            return language === "th" ? year + 543 : year;
                                        })()}
                                    </p>
                                </div>

                                {course.hasCertificate && (
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <Award className="h-5 w-5 text-muted-foreground" />
                                            <p className="text-sm font-medium">
                                                {t("ใบรับรอง", "Certificate")}
                                            </p>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {t("มีใบรับรอง", "Available")}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* For Students */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {t("สำหรับผู้เรียน", "For Students")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">
                                            {t("กลุ่มเป้าหมาย", "Target Audience")}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {course.targetAudience || t('ทุกคน', 'Everyone')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">
                                            {t("ความรู้พื้นฐาน", "Prerequisites")}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {course.prerequisites || t('ไม่มี', 'None')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">
                                            {t("เกณฑ์การประเมิน", "Assessment Criteria")}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {course.assessmentCriteria || t("ไม่ระบุ", "Not specified")}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Share */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {t("แชร์คอร์สนี้", "Share This Course")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            window.open(
                                                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                                                    shareUrl
                                                )
                                                } `,
                                                "_blank"
                                            )
                                        }
                                    >
                                        <Facebook className="h-4 w-4 mr-2" />
                                        Facebook
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            window.open(
                                                `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                                                    shareUrl
                                                )}& text=${encodeURIComponent(shareTitle)} `,
                                                "_blank"
                                            )
                                        }
                                    >
                                        <Twitter className="h-4 w-4 mr-2" />
                                        X
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <Instagram className="h-4 w-4 mr-2" />
                                        Instagram
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            window.open(
                                                `https://line.me/R/msg/text/?${encodeURIComponent(
                                                    `${shareTitle} ${shareUrl}`
                                                )}`,
                                                "_blank"
                                            )
                                        }
                                    >
                                        <Line className="h-4 w-4 mr-2" />
                                        Line
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
}

// Simple Line Icon component similar to Lucide icons
function Line({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9 9-4.03 9-9zm0 0" fill="none" strokeWidth="2" />
            <path d="M19.33 11.23c.2.2.2.53 0 .74l-6.66 6.66c-.2.2-.53.2-.74 0l-3.33-3.33c-.2-.2-.2-.53 0-.74.2-.2.53-.2.74 0l2.96 2.96 6.29-6.29c.2-.2.53-.2.74 0z" fill="none" />
            <path d="M10 15l-3-3 1.41-1.41L10 12.17l5.59-5.59L17 8z" fill="none" opacity="0" />
            {/* Fallback simple text or path if needed, but for now assuming typical usage */}
            <text x="12" y="16" fontSize="10" textAnchor="middle">L</text>
        </svg>
    );
}
