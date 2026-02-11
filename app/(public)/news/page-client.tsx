"use client";

import Link from "next/link";
import Image from "next/image";
import { SafeImage } from "@/components/safe-image";
import { useLanguage } from "@/lib/language-context";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { News } from "@/lib/types";
import { Newspaper } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface NewsPageClientProps {
    news: News[];
    basePath?: string;
}

export default function NewsPageClient({ news, basePath = "/news" }: NewsPageClientProps) {
    const { language, t } = useLanguage();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-8">
                <Newspaper className="h-10 w-10 text-primary" />
                <h1 className="text-[1.5rem] font-bold">
                    {t("ข่าวสารและประกาศ", "News & Announcements")}
                </h1>
            </div>

            {news.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {news.map((item) => (
                        <Link key={item.id} href={`${basePath}/${item.id}`}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden">
                                <div className="relative h-56">
                                    <SafeImage
                                        src={getImageUrl(item.imageId)}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                        fallbackType="news"
                                    />
                                </div>
                                <CardHeader>
                                    <CardTitle className="line-clamp-2 text-lg">
                                        {item.title}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {new Date(item.createdAt).toLocaleDateString(
                                            language === "th" ? "th-TH" : "en-US",
                                            {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            }
                                        )}
                                    </p>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    {t("ไม่พบข่าวสาร", "No news available")}
                </div>
            )}
        </div>
    );
}
