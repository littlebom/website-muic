import {
  getCategories,
  getCourses,
  getInstitutions,
  getCourseTypes
} from "@/lib/data-service";
import CoursesPageClient from "./page-client";

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  // Fetch data in parallel on the server
  const [
    courses,
    categories,
    institutions,
    courseTypes
  ] = await Promise.all([
    getCourses(), // Fetch all courses for client-side filtering
    getCategories(),
    getInstitutions(),
    getCourseTypes()
  ]);

  if (Array.isArray(courses)) {
    console.log(`[CoursesPage] Fetched ${courses.length} courses from DB.`);
    if (courses.length > 0) {
      console.log(`[CoursesPage] First course: ${courses[0].title} (ID: ${courses[0].id})`);
    }
  } else {
    console.error('[CoursesPage] Courses fetch returned non-array:', courses);
  }

  // Ensure data are arrays
  const safeCourses = Array.isArray(courses) ? courses : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeInstitutions = Array.isArray(institutions) ? institutions : [];
  const safeCourseTypes = Array.isArray(courseTypes) ? courseTypes : [];

  // Sort categories, institutions, and course types by name (Thai)
  const sortedCategories = [...safeCategories].sort((a, b) => {
    const nameA = a.name || a.nameEn || '';
    const nameB = b.name || b.nameEn || '';
    return nameA.localeCompare(nameB, 'th');
  });

  const sortedInstitutions = [...safeInstitutions].sort((a, b) => {
    const nameA = a.name || a.nameEn || '';
    const nameB = b.name || b.nameEn || '';
    return nameA.localeCompare(nameB, 'th');
  });

  const sortedCourseTypes = [...safeCourseTypes].sort((a, b) => {
    const nameA = a.name || a.nameEn || '';
    const nameB = b.name || b.nameEn || '';
    return nameA.localeCompare(nameB, 'th');
  });

  return (
    <CoursesPageClient
      initialCourses={JSON.parse(JSON.stringify(safeCourses))}
      categories={JSON.parse(JSON.stringify(sortedCategories))}
      institutions={JSON.parse(JSON.stringify(sortedInstitutions))}
      courseTypes={JSON.parse(JSON.stringify(sortedCourseTypes))}
    />
  );
}
