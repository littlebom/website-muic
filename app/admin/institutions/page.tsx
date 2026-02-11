import { getInstitutions } from "@/lib/data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { InstitutionsList, ExportInstitutionsButton } from "@/components/admin/institutions-list";
import { InstitutionImportDialog } from "@/components/admin/institution-import-dialog";

export default async function AdminInstitutionsPage() {
  const institutions = await getInstitutions();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Institutions</h1>
          <p className="text-muted-foreground">Manage educational institutions</p>
        </div>
        <div className="flex gap-2">
          <InstitutionImportDialog />
          <ExportInstitutionsButton institutions={institutions} />
          <Button asChild>
            <Link href="/admin/institutions/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Institution
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Institutions ({institutions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <InstitutionsList initialInstitutions={institutions} />
        </CardContent>
      </Card>
    </div>
  );
}
