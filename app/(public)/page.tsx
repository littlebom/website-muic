import {
  getCategories,
  getCourses,
  getNews,
  getBanners,
  getInstitutions,
  getCourseTypes
} from "@/lib/data-service";
import HomePageClient from "./page-client";

export const dynamic = 'force-dynamic'; // Ensure fresh data on each request (or use revalidate)

export default async function HomePage() {
  // Fetch data in parallel on the server
  const [
    categories,
    newCourses,
    popularCourses,
    news,
    banners,
    institutions,
    courseTypes
  ] = await Promise.all([
    getCategories(),
    getCourses({ limit: 6, sort: 'newest' }),
    getCourses({ limit: 4, sort: 'popular' }),
    getNews(4),
    getBanners(true),
    getInstitutions(),
    getCourseTypes()
  ]);

  // Safety checks to ensure all data are arrays
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeNewCourses = Array.isArray(newCourses) ? newCourses : [];
  const safePopularCourses = Array.isArray(popularCourses) ? popularCourses : [];
  const safeNews = Array.isArray(news) ? news : [];
  const safeBanners = Array.isArray(banners) ? banners : [];
  const safeInstitutions = Array.isArray(institutions) ? institutions : [];
  const safeCourseTypes = Array.isArray(courseTypes) ? courseTypes : [];

  console.log('[Homepage] Data loaded:', {
    categories: safeCategories.length,
    newCourses: safeNewCourses.length,
    popularCourses: safePopularCourses.length,
    news: safeNews.length,
    banners: safeBanners.length,
    institutions: safeInstitutions.length,
    courseTypes: safeCourseTypes.length,
  });

  return (
    <HomePageClient
      categories={safeCategories}
      newCourses={safeNewCourses}
      popularCourses={safePopularCourses}
      news={safeNews}
      banners={safeBanners}
      institutions={safeInstitutions}
      courseTypes={safeCourseTypes}
    />
  );
}
