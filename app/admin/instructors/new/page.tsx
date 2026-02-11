import { InstructorForm } from "@/components/admin/instructor-form";

export default function NewInstructorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Instructor</h1>
        <p className="text-muted-foreground">Add a new instructor</p>
      </div>

      <InstructorForm />
    </div>
  );
}
