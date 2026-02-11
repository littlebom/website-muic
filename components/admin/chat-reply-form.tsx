"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatReplyFormProps {
  conversationId: string;
}

export function ChatReplyForm({ conversationId }: ChatReplyFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_type: "admin",
          sender_name: "Admin",
          message: message.trim(),
        }),
      });

      if (res.ok) {
        setMessage("");
        router.refresh();
        alert("ส่งข้อความสำเร็จ");
      } else {
        alert("เกิดข้อผิดพลาดในการส่งข้อความ");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("เกิดข้อผิดพลาดในการส่งข้อความ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="พิมพ์ข้อความของคุณที่นี่..."
        rows={4}
        disabled={loading}
      />
      <Button type="submit" disabled={loading || !message.trim()}>
        {loading ? "กำลังส่ง..." : "ส่งข้อความ"}
      </Button>
    </form>
  );
}
