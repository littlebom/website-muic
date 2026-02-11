"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { Search, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { HtmlContent } from "@/components/admin/html-content";

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

import { Suspense } from "react";

function TrackTicketContent() {
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [searchData, setSearchData] = useState({
    ticket_number: "",
    email: "",
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTickets([]);

    // Validate that at least one field is filled
    if (!searchData.ticket_number.trim() && !searchData.email.trim()) {
      setError("กรุณากรอกหมายเลข Ticket หรืออีเมลอย่างน้อย 1 อย่าง");
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (searchData.ticket_number.trim()) {
        params.append('ticket_number', searchData.ticket_number.trim());
      }
      if (searchData.email.trim()) {
        params.append('email', searchData.email.trim());
      }

      const response = await fetch(`/api/tickets/track?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "ไม่พบ Ticket ที่ตรงกับข้อมูลที่ค้นหา");
        return;
      }

      setTickets(Array.isArray(data.data) ? data.data : [data.data]);
    } catch (error) {
      console.error("Error:", error);
      setError("เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (ticketId: string) => {
    if (!replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: replyMessage,
          sender_type: "user",
        }),
      });

      const data = await response.json();
      if (data.success) {
        setReplyMessage("");
        // Refresh ticket data
        handleSearch(new Event("submit") as any);
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("เกิดข้อผิดพลาดในการส่งข้อความ");
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "in_progress":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "resolved":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "closed":
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      new: "ใหม่",
      in_progress: "กำลังดำเนินการ",
      resolved: "แก้ไขแล้ว",
      closed: "ปิด",
    };
    return statusMap[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colorMap: Record<string, string> = {
      low: "bg-gray-100 text-gray-800",
      normal: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return colorMap[priority] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ติดตามสถานะ Ticket</h1>
          <p className="text-lg text-gray-600">
            ตรวจสอบสถานะการแจ้งปัญหาของคุณ
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>ค้นหา Ticket</CardTitle>
            <CardDescription>
              กรอกหมายเลข Ticket หรืออีเมลที่ใช้แจ้งปัญหา (อย่างใดอย่างหนึ่ง)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket_number">
                    หมายเลข Ticket
                  </Label>
                  <Input
                    id="ticket_number"
                    value={searchData.ticket_number}
                    onChange={(e) =>
                      setSearchData({ ...searchData, ticket_number: e.target.value })
                    }
                    placeholder="TK-2025-0001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    อีเมล
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={searchData.email}
                    onChange={(e) =>
                      setSearchData({ ...searchData, email: e.target.value })
                    }
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "กำลังค้นหา..." : "ค้นหา"}
                </Button>
                <Link href="/support" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    แจ้งปัญหาใหม่
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Ticket Details */}
        {tickets.length > 0 && (
          <div className="space-y-6">
            {tickets.length > 1 && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
                พบ {tickets.length} Tickets ที่ตรงกับข้อมูลที่ค้นหา
              </div>
            )}

            {tickets.map((ticket) => (
              <div key={ticket.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl">{ticket.ticket_number}</CardTitle>
                        <CardDescription className="mt-1">
                          สร้างเมื่อ: {new Date(ticket.created_at).toLocaleString("th-TH")}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className="font-semibold">{getStatusText(ticket.status)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">ผู้แจ้ง:</p>
                        <p className="font-medium">{ticket.user_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">ประเภท:</p>
                        <p className="font-medium">{ticket.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">ความสำคัญ:</p>
                        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">อัพเดทล่าสุด:</p>
                        <p className="font-medium text-sm">
                          {new Date(ticket.updated_at).toLocaleString("th-TH")}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">หัวข้อ:</p>
                      <p className="font-semibold text-lg">{ticket.subject}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">รายละเอียด:</p>
                      <HtmlContent
                        content={ticket.description}
                        className="bg-gray-50 p-4 rounded border prose prose-sm max-w-none"
                      />
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
                                {reply.sender_type === "admin" ? "🛠️ เจ้าหน้าที่" : "👤 คุณ"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(reply.created_at).toLocaleString("th-TH")}
                              </span>
                            </div>
                            <HtmlContent
                              content={reply.message}
                              className="prose prose-sm max-w-none"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4">
                        ยังไม่มีการตอบกลับ เจ้าหน้าที่จะติดต่อกลับภายใน 1-2 วันทำการ
                      </p>
                    )}

                    {/* Reply Form */}
                    {ticket.status !== "closed" && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-semibold mb-2">ตอบกลับเพิ่มเติม:</p>
                        <TiptapEditor
                          content={replyMessage}
                          onChange={(html) => setReplyMessage(html)}
                        />
                        <Button
                          onClick={() => handleSendReply(ticket.id)}
                          disabled={sendingReply || !replyMessage.trim()}
                          className="w-full mt-3"
                        >
                          {sendingReply ? "กำลังส่ง..." : "ส่งข้อความ"}
                        </Button>
                      </div>
                    )}

                    {ticket.status === "closed" && (
                      <div className="bg-gray-100 p-4 rounded text-center">
                        <p className="text-sm text-gray-600">
                          Ticket นี้ถูกปิดแล้ว หากต้องการความช่วยเหลือเพิ่มเติม กรุณาแจ้งปัญหาใหม่
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackTicketPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-8 text-center">กำลังโหลด...</div>}>
      <TrackTicketContent />
    </Suspense>
  );
}
