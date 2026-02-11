import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper";

// Force dynamic rendering for all admin pages
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: "Admin Dashboard - Thai MOOC",
  description: "Admin dashboard for managing Thai MOOC platform",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
