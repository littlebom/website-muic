import { getInstructors, getInstitutions } from "@/lib/data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { InstructorsList } from "@/components/admin/instructors-list";
import { InstructorImportDialog } from "@/components/admin/instructor-import-dialog";
import { getSession } from "@/lib/auth";

export default async function AdminInstructorsPage() {
  const session = await getSession();
  const user = session;
  const isInstitutionAdmin = user?.role === 'institution_admin' && user.institutionId;
  const institutionId = isInstitutionAdmin ? user.institutionId! : undefined;

  const [instructors, allInstitutions] = await Promise.all([
    getInstructors(institutionId),
    getInstitutions(),
  ]);

  // Filter institutions list for the dropdown/display as well if needed
  // If I am Inst Admin, I probably only want to see my institution in the 'institutions' list passed to the child component
  const institutions = isInstitutionAdmin
    ? allInstitutions.filter(i => i.id === institutionId)
    : allInstitutions;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Instructors</h1>
          <p className="text-muted-foreground">Manage instructors</p>
        </div>
        <div className="flex gap-2">
          <InstructorImportDialog />
          <Button asChild>
            <Link href="/admin/instructors/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Instructor
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Instructors ({instructors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <InstructorsList
            initialInstructors={instructors}
            institutions={institutions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
