"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SetupPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSetup = async () => {
    if (!password) {
      alert("กรุณากรอกรหัสผ่าน");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/setup-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl text-center">
            🚀 Thai MOOC - Database Setup
          </CardTitle>
          <p className="text-center text-gray-600 mt-2">
            ตั้งค่าฐานข้อมูลและเริ่มต้นใช้งานระบบ
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {!result && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  📋 สคริปต์นี้จะทำสิ่งต่อไปนี้:
                </h3>
                <ul className="list-disc list-inside text-blue-800 space-y-1">
                  <li>Generate Prisma Client</li>
                  <li>สร้างตารางในฐานข้อมูล</li>
                  <li>ใส่ข้อมูลเริ่มต้น (categories, institutions, etc.)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  รหัสผ่านสำหรับตั้งค่า:
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  รหัสผ่านเริ่มต้น: <code className="bg-gray-100 px-2 py-1 rounded">thaimooc2024</code>
                </p>
              </div>

              <Button
                onClick={handleSetup}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? "⏳ กำลังตั้งค่า..." : "🚀 เริ่มตั้งค่าฐานข้อมูล"}
              </Button>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ สำคัญ:</h3>
                <ul className="list-disc list-inside text-yellow-800 space-y-1 text-sm">
                  <li>ตรวจสอบให้แน่ใจว่าคุณได้สร้างไฟล์ .env แล้ว</li>
                  <li>DATABASE_URL ต้องถูกต้อง</li>
                  <li>ลบไฟล์ /app/setup/ หลังจากตั้งค่าเสร็จแล้ว</li>
                </ul>
              </div>
            </>
          )}

          {result && (
            <div className="space-y-4">
              {result.success ? (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-2xl font-bold text-green-900 mb-4 flex items-center gap-2">
                      ✅ ตั้งค่าฐานข้อมูลเสร็จสมบูรณ์!
                    </h3>

                    <div className="space-y-2">
                      {result.steps?.map((step: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-green-800"
                        >
                          {step.status === "success" && "✅"}
                          {step.status === "warning" && "⚠️"}
                          {step.status === "error" && "❌"}
                          <span>{step.message}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-white rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        📋 ขั้นตอนถัดไป:
                      </h4>
                      <ol className="list-decimal list-inside text-gray-700 space-y-1">
                        <li>ลบโฟลเดอร์ <code className="bg-gray-100 px-2 py-1 rounded">/app/setup/</code> ทิ้ง</li>
                        <li>ทดสอบเว็บไซต์ของคุณ</li>
                        <li>เข้าใช้งาน Admin Panel</li>
                      </ol>
                    </div>
                  </div>

                  <Button
                    onClick={() => (window.location.href = "/")}
                    className="w-full"
                    size="lg"
                  >
                    🏠 ไปหน้าแรก
                  </Button>
                </>
              ) : (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-2xl font-bold text-red-900 mb-4">
                      ❌ เกิดข้อผิดพลาดในการตั้งค่า
                    </h3>

                    <div className="space-y-2 mb-4">
                      {result.steps?.map((step: any, index: number) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 ${
                            step.status === "error"
                              ? "text-red-800 font-semibold"
                              : "text-gray-700"
                          }`}
                        >
                          {step.status === "success" && "✅"}
                          {step.status === "warning" && "⚠️"}
                          {step.status === "error" && "❌"}
                          {step.status === "running" && "⏳"}
                          <span>{step.message}</span>
                        </div>
                      ))}
                    </div>

                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-4 p-4 bg-red-100 rounded">
                        <h4 className="font-semibold text-red-900 mb-2">
                          Error Details:
                        </h4>
                        <ul className="list-disc list-inside text-red-800 text-sm">
                          {result.errors.map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-6 p-4 bg-white rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        🔍 วิธีแก้ปัญหา:
                      </h4>
                      <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                        <li>ตรวจสอบ DATABASE_URL ในไฟล์ .env</li>
                        <li>ตรวจสอบว่าฐานข้อมูลถูกสร้างแล้ว</li>
                        <li>ตรวจสอบ username และ password ถูกต้อง</li>
                        <li>ตรวจสอบว่าฐานข้อมูลสามารถเชื่อมต่อได้</li>
                      </ul>
                    </div>
                  </div>

                  <Button
                    onClick={() => setResult(null)}
                    variant="outline"
                    className="w-full"
                  >
                    ← ลองอีกครั้ง
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx global>{`
        code {
          font-family: 'Courier New', monospace;
        }
      `}</style>
    </div>
  );
}
