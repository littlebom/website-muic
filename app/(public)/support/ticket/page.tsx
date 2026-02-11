"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { Label } from "@/components/ui/label";
import { LifeBuoy, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [formData, setFormData] = useState({
    user_name: "",
    user_email: "",
    subject: "",
    description: "",
    category: "general",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setTicketNumber(data.data.ticket_number);
        setSuccess(true);
        setFormData({
          user_name: "",
          user_email: "",
          subject: "",
          description: "",
          category: "general",
        });
      }
    } catch (error) {
      console.error("Error submitting ticket:", error);
      alert("เกิดข้อผิดพลาดในการส่งแบบฟอร์ม กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ศูนย์ช่วยเหลือ</h1>
          <p className="text-lg text-gray-600">
            แจ้งปัญหาหรือข้อสงสัยเกี่ยวกับการใช้งานระบบ Thai MOOC
          </p>
        </div>

        {success ? (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <CardTitle className="text-green-900">ส่งคำขอสำเร็จ!</CardTitle>
                  <CardDescription className="text-green-700">
                    เราได้รับข้อความของคุณแล้ว
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-1">หมายเลข Ticket ของคุณคือ:</p>
                <p className="text-2xl font-bold text-primary">{ticketNumber}</p>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                เจ้าหน้าที่จะตรวจสอบและติดต่อกลับไปยังอีเมล <span className="font-semibold">{formData.user_email}</span> ภายใน 1-2 วันทำการ
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setSuccess(false)}
                  variant="outline"
                  className="flex-1"
                >
                  แจ้งปัญหาอีกครั้ง
                </Button>
                <Link href="/" className="flex-1">
                  <Button className="w-full">
                    กลับหน้าหลัก
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>แบบฟอร์มแจ้งปัญหา</CardTitle>
              <CardDescription>
                กรุณากรอกข้อมูลให้ครบถ้วน เพื่อให้เราสามารถช่วยเหลือคุณได้อย่างรวดเร็ว
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user_name">ชื่อ-นามสกุล</Label>
                    <Input
                      id="user_name"
                      name="user_name"
                      value={formData.user_name}
                      onChange={handleChange}
                      placeholder="กรอกชื่อของคุณ"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user_email">
                      อีเมล <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="user_email"
                      name="user_email"
                      type="email"
                      value={formData.user_email}
                      onChange={handleChange}
                      placeholder="example@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">ประเภทปัญหา</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="general">ทั่วไป</option>
                    <option value="technical">ปัญหาทางเทคนิค</option>
                    <option value="account">บัญชีผู้ใช้</option>
                    <option value="course">เนื้อหาคอร์ส</option>
                    <option value="payment">การชำระเงิน</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">
                    หัวข้อ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="สรุปปัญหาหรือคำถามของคุณ"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    รายละเอียด <span className="text-red-500">*</span>
                  </Label>
                  <TiptapEditor
                    content={formData.description}
                    onChange={(html) => setFormData({ ...formData, description: html })}
                  />
                </div>

                <div className="flex gap-3">
                  <Link href="/" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      ยกเลิก
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? "กำลังส่ง..." : "ส่งคำขอ"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            ต้องการความช่วยเหลือเร่งด่วน?{" "}
            <a href="mailto:support@thaimooc.ac.th" className="text-primary hover:underline">
              ติดต่อเรา
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
