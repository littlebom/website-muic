import { getBanners } from "@/lib/data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { BannersList } from "@/components/admin/banners-list";

import { getSession } from "@/lib/auth";

export default async function AdminBannersPage() {
  const session = await getSession();
  const user = session;
  const isInstitutionAdmin = user?.role === 'institution_admin' && user.institutionId;
  const institutionId = isInstitutionAdmin ? user.institutionId! : undefined;

  const banners = await getBanners(institutionId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Banners</h1>
          <p className="text-muted-foreground">Manage homepage banners</p>
        </div>
        <Button asChild>
          <Link href="/admin/banners/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Banner
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Banners ({banners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <BannersList initialBanners={banners} />
        </CardContent>
      </Card>
    </div>
  );
}
