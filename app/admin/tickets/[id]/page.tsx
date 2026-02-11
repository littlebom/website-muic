"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trash2, Send } from "lucide-react";
import Link from "next/link";
import { HtmlContent } from "@/components/admin/html-content";
import { TiptapEditor } from "@/components/ui/tiptap-editor";

interface Ticket {
  id: string;
  ticket_number: string;
  user_name: string;
  user_email: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  replies?: Reply[];
}

interface Reply {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [ticketId, setTicketId] = useState<string>("");

  useEffect(() => {
    params.then((resolvedParams) => {
      setTicketId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      const data = await res.json();
      if (data.success) {
        setTicket(data.data);

        // Mark ticket as read when viewed
        if (!data.data.is_read) {
          await fetch(`/api/tickets/${ticketId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_read: true }),
          });
        }
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTicket();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTicket();
      }
    } catch (error) {
      console.error("Error updating priority:", error);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: replyMessage,
          sender_type: "admin",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReplyMessage("");
        fetchTicket();
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("เกิดข้อผิดพลาดในการส่งข้อความ");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบ Ticket นี้?")) return;

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        router.push("/admin/tickets");
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/tickets">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">ไม่พบ Ticket</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/tickets">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">รายละเอียด Ticket</h1>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          ลบ
        </Button>
      </div>

      {/* Ticket Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{ticket.ticket_number}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                สร้างเมื่อ: {new Date(ticket.created_at).toLocaleString("th-TH")}
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">ชื่อผู้แจ้ง:</p>
              <p className="font-medium">{ticket.user_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">อีเมล:</p>
              <p className="font-medium">{ticket.user_email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ประเภท:</p>
              <p className="font-medium">{ticket.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">สถานะ:</p>
              <p className="font-medium">{ticket.status}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">หัวข้อ:</p>
            <p className="font-semibold text-lg">{ticket.subject}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">รายละเอียด:</p>
            <HtmlContent content={ticket.description} className="bg-gray-50 p-4 rounded border" />
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      <Card>
        <CardHeader>
          <CardTitle>การตอบกลับ ({ticket.replies?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.replies && ticket.replies.length > 0 ? (
            <div className="space-y-3">
              {ticket.replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`p-4 rounded ${reply.sender_type === "admin"
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : "bg-gray-50 border-l-4 border-gray-300"
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-sm">
                      {reply.sender_type === "admin" ? "เจ้าหน้าที่" : "ผู้แจ้ง"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(reply.created_at).toLocaleString("th-TH")}
                    </span>
                  </div>
                  <HtmlContent content={reply.message} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">ยังไม่มีการตอบกลับ</p>
          )}

          {/* Reply Form */}
          <div className="pt-4 border-t">
            <p className="text-sm font-semibold mb-2">ตอบกลับ:</p>
            <TiptapEditor
              content={replyMessage}
              onChange={(html) => setReplyMessage(html)}
            />
            <Button
              onClick={handleSendReply}
              disabled={sending || !replyMessage.trim()}
              className="w-full mt-3"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? "กำลังส่ง..." : "ส่งข้อความ"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
