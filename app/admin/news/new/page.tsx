import { NewsForm } from "@/components/admin/news-form";

export default function NewNewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create News</h1>
        <p className="text-muted-foreground">Add a new news article</p>
      </div>

      <NewsForm />
    </div>
  );
}
