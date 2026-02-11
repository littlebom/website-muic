import { notFound } from "next/navigation";
import { CourseTypeForm } from "@/components/admin/course-type-form";

async function getCourseType(id: string) {
  if (id === "new") return null;

  try {
    // Always use localhost for server-side fetching (this is a Server Component)
    const res = await fetch(
      `http://localhost:3000/api/course-types/${id}`,
      { cache: "no-store" }
    );

    if (!res.ok) return null;
    const data = await res.json();
    // Handle both direct object and object with data property
    return data.data || data;
  } catch (error) {
    console.error("Error fetching course type:", error);
    return null;
  }
}

export default async function CourseTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseType = await getCourseType(id);

  if (id !== "new" && !courseType) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {courseType ? "แก้ไขประเภทรายวิชา" : "เพิ่มประเภทรายวิชา"}
        </h1>
        <p className="text-muted-foreground">
          {courseType ? "แก้ไขข้อมูลประเภทรายวิชา" : "สร้างประเภทรายวิชาใหม่"}
        </p>
      </div>

      <CourseTypeForm courseType={courseType} />
    </div>
  );
}
