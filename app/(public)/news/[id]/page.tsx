"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { SafeImage } from "@/components/safe-image";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { SocialShare } from "@/components/ui/social-share";
import type { News } from "@/lib/types";
import { ArrowLeft, Calendar } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { SafeHTML } from "@/components/safe-html";

export default function NewsDetailPage() {
  const { language, t } = useLanguage();
  const params = useParams();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const id = params.id as string;
      const newsRes = await fetch(`/api/news/${id}`).then(r => r.json());
      const data = newsRes.data ? {
        ...newsRes.data,
        createdAt: new Date(newsRes.data.createdAt),
        updatedAt: new Date(newsRes.data.updatedAt),
      } : null;
      setNews(data);
      setLoading(false);
    }
    loadData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {t("ไม่พบข่าวสาร", "News Not Found")}
        </h1>
        <Button asChild>
          <Link href="/news">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("กลับไปหน้าข่าวสาร", "Back to News")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Image */}
      <div className="relative h-96 w-full">
        <SafeImage
          src={getImageUrl(news.imageId)}
          alt={news.title}
          fill
          className="object-cover"
          priority
          fallbackType="news"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button asChild variant="secondary" className="mb-4">
            <Link href="/news">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("กลับไปหน้าข่าวสาร", "Back to News")}
            </Link>
          </Button>

          {/* Content Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {news.title}
            </h1>

            <div className="flex items-center gap-2 text-muted-foreground mb-8">
              <Calendar className="h-4 w-4" />
              <time>
                {new Date(news.createdAt).toLocaleDateString(
                  language === "th" ? "th-TH" : "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </time>
            </div>

            <div className="prose prose-lg max-w-none">
              <SafeHTML
                html={news.content}
                className="whitespace-pre-wrap"
              />
            </div>

            {/* Social Share Section */}
            <div className="mt-8 pt-8 border-t">
              <SocialShare
                url={`/news/${news.id}`}
                title={news.title}
                description={news.content.substring(0, 150)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
