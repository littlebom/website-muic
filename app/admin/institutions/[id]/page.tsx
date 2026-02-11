import { getInstitutionById } from "@/lib/data";
import { notFound } from "next/navigation";
import { InstitutionForm } from "@/components/admin/institution-form";

export default async function EditInstitutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const institution = await getInstitutionById(id);

  if (!institution) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Institution</h1>
        <p className="text-muted-foreground">Update institution information</p>
      </div>

      <InstitutionForm institution={institution} />
    </div>
  );
}
