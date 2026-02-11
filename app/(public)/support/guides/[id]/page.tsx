import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Eye, Tag } from "lucide-react";
import Link from "next/link";
import { query, execute } from "@/lib/data";
// import { notFound } from "next/navigation";
import { sanitize } from "@/lib/sanitize";

// export const dynamic = 'force-dynamic';

// Fetch guide by ID
async function getGuide(id: string) {
  try {
    const guides = await query<any>(
      `SELECT id, title, content, category, keywords, view_count, created_at, updated_at
       FROM guides
       WHERE id = ? AND is_active = TRUE`,
      [id]
    );

    if (guides.length === 0) {
      return null;
    }

    // Increment view count
    try {
      await execute("UPDATE guides SET view_count = view_count + 1 WHERE id = ?", [id]);
    } catch (e) {
      // Ignore update error during build or read-only mode
    }

    return guides[0];
  } catch (error) {
    console.error("Error fetching guide:", error);
    return null;
  }
}

// Get related guides from same category
async function getRelatedGuides(category: string, currentId: string) {
  try {
    const guides = await query<any>(
      `SELECT id, title, view_count
       FROM guides
       WHERE category = ? AND id != ? AND is_active = TRUE
       ORDER BY view_count DESC
       LIMIT 5`,
      [category, currentId]
    );
    return guides;
  } catch (error) {
    console.error("Error fetching related guides:", error);
    return [];
  }
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const guide = await getGuide(id);

  if (!guide) {
    // notFound(); 
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500">
        Guide not found or Database unavailable during build.
      </div>
    );
  }

  const relatedGuides = await getRelatedGuides(guide.category || "ทั่วไป", id);

  // Sanitize content on server side
  const safeContent = sanitize(guide.content);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/support">
            <Button variant="ghost" className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
              กลับไปหน้าศูนย์ช่วยเหลือ
            </Button>
          </Link>

          {/* Main Content */}
          <Card className="mb-8">
            <CardHeader className="border-b">
              <div className="space-y-4">
                {guide.category && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Tag className="w-4 h-4" />
                    {guide.category}
                  </div>
                )}
                <CardTitle className="text-3xl">{guide.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    อัพเดทล่าสุด: {new Date(guide.updated_at).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    เข้าชม {guide.view_count} ครั้ง
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <div
                className="prose prose-lg max-w-none
                  prose-headings:text-gray-900
                  prose-p:text-gray-700
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-gray-900
                  prose-ul:text-gray-700
                  prose-ol:text-gray-700
                  prose-li:text-gray-700
                  prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded
                  prose-pre:bg-gray-900 prose-pre:text-gray-100
                  prose-img:rounded-lg prose-img:shadow-lg
                "
                dangerouslySetInnerHTML={{ __html: safeContent }}
              />
            </CardContent>
          </Card>

          {/* Related Guides */}
          {relatedGuides.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                คู่มือที่เกี่ยวข้อง
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {relatedGuides.map((relatedGuide: { id: string; title: string; view_count: number }) => (
                  <Link key={relatedGuide.id} href={`/support/guides/${relatedGuide.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 hover:text-primary">
                            {relatedGuide.title}
                          </h3>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {relatedGuide.view_count}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Help Section */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                คู่มือนี้เป็นประโยชน์กับคุณหรือไม่?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                หากคุณยังมีคำถามหรือต้องการความช่วยเหลือเพิ่มเติม
              </p>
              <div className="flex gap-3">
                <Link href="/support/ticket">
                  <Button variant="default" size="sm">
                    แจ้งปัญหา
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" size="sm">
                    ติดต่อเรา
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
