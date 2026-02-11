"use client";

import { use, useEffect, useState } from "react";
import { PopupForm } from "@/components/admin/popup-form";
import type { Popup } from "@/lib/types";

export default function EditPopupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [popup, setPopup] = useState<Popup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPopup() {
      try {
        const response = await fetch(`/api/popups/${id}`);
        const data = await response.json();
        if (data.success) {
          const popupData = {
            ...data.data,
            createdAt: new Date(data.data.createdAt),
            updatedAt: new Date(data.data.updatedAt),
            startDate: data.data.startDate ? new Date(data.data.startDate) : null,
            endDate: data.data.endDate ? new Date(data.data.endDate) : null,
          };
          setPopup(popupData);
        }
      } catch (error) {
        console.error("Failed to fetch popup:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPopup();
  }, [id]);

  if (loading) {
    return <div className="p-8">กำลังโหลด...</div>;
  }

  if (!popup) {
    return <div className="p-8">ไม่พบ Popup</div>;
  }

  return <PopupForm popup={popup} language="th" />;
}
