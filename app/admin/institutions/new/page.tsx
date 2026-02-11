import { InstitutionForm } from "@/components/admin/institution-form";

export default function NewInstitutionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Institution</h1>
        <p className="text-muted-foreground">Add a new institution</p>
      </div>

      <InstitutionForm />
    </div>
  );
}
