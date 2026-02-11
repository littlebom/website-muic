import { UserForm } from "@/components/admin/user-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { queryOne } from "@/lib/mysql-direct";
import { notFound, redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getUser(id: string) {
  const user = await queryOne<any>(
    'SELECT id, username, name, email, role, isActive FROM admin_users WHERE id = ?',
    [id]
  );

  if (!user) {
    notFound();
  }

  return user;
}

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Check if user is Super Admin
  try {
    await requireSuperAdmin();
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะ Super Admin เท่านั้นที่สามารถจัดการ Admin Users ได้
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
    redirect('/admin/login');
  }

  const { id } = await params;
  const user = await getUser(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">แก้ไขผู้ใช้งาน</h1>
          <p className="text-muted-foreground mt-2">
            แก้ไขข้อมูลบัญชีผู้ดูแลระบบ: {user.name}
          </p>
        </div>
      </div>

      <UserForm user={user} />
    </div>
  );
}
