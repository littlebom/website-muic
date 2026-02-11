import { notFound } from "next/navigation";
import { GuideForm } from "@/components/admin/guide-form";

async function getGuide(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/guides/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    return null;
  }
}

export default async function EditGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guide = await getGuide(id);
  if (!guide) notFound();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">แก้ไขคู่มือ</h1>
      <GuideForm guide={guide} isEdit={true} />
    </div>
  );
}
