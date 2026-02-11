import { getCategories, getCourseTypes, getInstructors, getInstitutions } from "@/lib/data";
import { CourseForm } from "@/components/admin/course-form";

export default async function NewCoursePage() {
  const [categories, courseTypes, instructors, institutions] = await Promise.all([
    getCategories(),
    getCourseTypes(),
    getInstructors(),
    getInstitutions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Course</h1>
        <p className="text-muted-foreground">Create a new course</p>
      </div>

      <CourseForm
        categories={categories}
        courseTypes={courseTypes}
        instructors={instructors}
        institutions={institutions}
      />
    </div>
  );
}
