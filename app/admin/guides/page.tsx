import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { GuidesList } from "@/components/admin/guides-list";
import { getGuides } from "@/lib/data";

export default async function AdminGuidesPage() {
  const rawGuides = await getGuides({ active: true });
  const guides = rawGuides.map(g => ({
    ...g,
    created_at: g.created_at.toISOString(),
    updated_at: g.updated_at.toISOString(),
    is_active: !!g.is_active,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">คู่มือและคำถามที่พบบ่อย</h1>
        <Link href="/admin/guides/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มคู่มือใหม่
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการคู่มือทั้งหมด ({guides.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <GuidesList initialGuides={guides} />
        </CardContent>
      </Card>
    </div>
  );
}
