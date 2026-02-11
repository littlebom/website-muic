import { GuideForm } from "@/components/admin/guide-form";

export default function NewGuidePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">เพิ่มคู่มือใหม่</h1>
      <GuideForm />
    </div>
  );
}
