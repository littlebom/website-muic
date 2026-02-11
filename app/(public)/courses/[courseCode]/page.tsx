import { notFound } from "next/navigation";
import {
  getCourseById,
  getCategories,
  getInstructors,
  getInstitutions
} from "@/lib/data-service";
import CourseDetailsPageClient from "./page-client";
import { Metadata, ResolvingMetadata } from "next";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ courseCode: string }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { courseCode } = await params;
  const course = await getCourseById(courseCode);

  if (!course) {
    return {
      title: 'Course Not Found',
    };
  }

  return {
    title: `${course.title} - Thai MOOC`,
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
      images: [course.imageId || '/placeholder.png'],
    },
  };
}

export default async function CourseDetailsPage({ params }: Props) {
  const { courseCode } = await params;

  // Fetch data in parallel
  const [
    course,
    categories,
    allInstructors,
    institutions
  ] = await Promise.all([
    getCourseById(courseCode),
    getCategories(),
    getInstructors(),
    getInstitutions()
  ]);

  if (!course) {
    notFound();
  }

  // Ensure data arrays are valid
  const safeInstructors = Array.isArray(allInstructors) ? allInstructors : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeInstitutions = Array.isArray(institutions) ? institutions : [];

  // Resolve relations
  const courseCategories = course.courseCategories || course.course_categories || [];
  const category = courseCategories.length > 0
    ? safeCategories.find(c => c.id === courseCategories[0].categoryId) || null
    : null;
  const institution = safeInstitutions.find(i => i.id === course.institutionId) || null;

  // Resolve instructors
  let instructors: any[] = [];
  const courseInstructors = course.courseInstructors || course.course_instructors || [];

  if (courseInstructors.length > 0) {
    instructors = courseInstructors
      .map(ci => safeInstructors.find(i => i.id === ci.instructorId))
      .filter(Boolean);
  } else if (course.instructorId) {
    const instructor = safeInstructors.find(i => i.id === course.instructorId);
    if (instructor) {
      instructors = [instructor];
    }
  }

  return (
    <CourseDetailsPageClient
      course={course}
      category={category}
      instructors={instructors}
      institution={institution}
      categories={safeCategories}
    />
  );
}
