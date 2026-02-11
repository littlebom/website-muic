import { getNews } from "@/lib/data-service";
import NewsPageClient from "./page-client";

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const news = await getNews();

  return <NewsPageClient news={news} />;
}
