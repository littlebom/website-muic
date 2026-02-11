import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UsersList } from "@/components/admin/users-list";
import { query } from "@/lib/mysql-direct";
import { requireSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getUsers() {
  const users = await query<any>(
    'SELECT id, username, name, email, role, isActive, lastLogin, createdAt, updatedAt FROM admin_users ORDER BY createdAt DESC'
  );

  return users;
}

export default async function UsersPage() {
  // Check if user is Super Admin
  try {
    await requireSuperAdmin();
  } catch (error) {
    // If not super admin, show access denied
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
    // If not authenticated, redirect to login
    redirect('/admin/login');
  }

  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">จัดการผู้ใช้งาน</h1>
          <p className="text-muted-foreground mt-2">
            จัดการบัญชีผู้ดูแลระบบ (Admin Users)
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มผู้ใช้งาน
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div>กำลังโหลด...</div>}>
        <UsersList initialUsers={users} />
      </Suspense>
    </div>
  );
}
