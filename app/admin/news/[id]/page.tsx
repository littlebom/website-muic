import { getNewsById } from "@/lib/data";
import { notFound } from "next/navigation";
import { NewsForm } from "@/components/admin/news-form";

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const news = await getNewsById(id);

  if (!news) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit News</h1>
        <p className="text-muted-foreground">Update news information</p>
      </div>

      <NewsForm news={news} />
    </div>
  );
}
