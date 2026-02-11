import { getBannerById } from "@/lib/data";
import { BannerForm } from "@/components/admin/banner-form";
import { notFound } from "next/navigation";

interface EditBannerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBannerPage({ params }: EditBannerPageProps) {
  const { id } = await params;
  const banner = await getBannerById(id);

  if (!banner) {
    notFound();
  }

  return <BannerForm banner={banner} language="th" />;
}
