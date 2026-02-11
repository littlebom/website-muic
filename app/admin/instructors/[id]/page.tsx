import { getInstructorById } from "@/lib/data";
import { notFound } from "next/navigation";
import { InstructorForm } from "@/components/admin/instructor-form";

export default async function EditInstructorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const instructor = await getInstructorById(id);

  if (!instructor) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Instructor</h1>
        <p className="text-muted-foreground">Update instructor information</p>
      </div>

      <InstructorForm instructor={instructor} />
    </div>
  );
}
