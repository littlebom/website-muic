"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Conversation {
  id: string;
  user_name: string;
  user_email: string;
  status: string;
  priority: string;
  category: string;
  last_message_at: string;
}

interface ChatListProps {
  conversations: Conversation[];
}

export function ChatList({ conversations }: ChatListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, userName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`คุณต้องการลบการสนทนากับ "${userName}" หรือไม่?\n\n⚠️ คำเตือน: การลบจะทำให้:\n- ข้อความทั้งหมดในการสนทนานี้ถูกลบถาวร\n- ไม่สามารถกู้คืนได้\n\nกด OK เพื่อยืนยันการลบ`)) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/chat/conversations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("ลบการสนทนาสำเร็จ");
        router.refresh();
      } else {
        alert("เกิดข้อผิดพลาดในการลบ");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("เกิดข้อผิดพลาดในการลบ");
    } finally {
      setDeletingId(null);
    }
  };

  if (conversations.length === 0) {
    return <p className="text-center text-gray-500 py-8">ยังไม่มีการสนทนา</p>;
  }

  return (
    <div className="space-y-3">
      {conversations.map((conv) => (
        <div key={conv.id} className="relative group">
          <Link href={`/admin/chat/${conv.id}`}>
            <div className="p-4 border rounded hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold">{conv.user_name || "Unknown User"}</p>
                  <p className="text-sm text-gray-600">{conv.user_email || "No email"}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    หมวดหมู่: {conv.category || "ไม่ระบุ"} |
                    สถานะ: {conv.status} |
                    ความสำคัญ: {conv.priority}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(conv.last_message_at).toLocaleString("th-TH")}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => handleDelete(conv.id, conv.user_name, e)}
                    disabled={deletingId === conv.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
