"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Download, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function CourseImportDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [useThaiEncoding, setUseThaiEncoding] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert("กรุณาเลือกไฟล์ CSV เท่านั้น");
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert("กรุณาเลือกไฟล์ CSV");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Parse CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: useThaiEncoding ? 'windows-874' : 'utf-8',
        complete: async (results) => {
          try {
            // Send to API
            const response = await fetch("/api/courses/import", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                courses: results.data,
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || "Failed to import courses");
            }

            setResult(data.results);
            router.refresh();
          } catch (error) {
            console.error("Error importing courses:", error);
            alert(
              error instanceof Error
                ? error.message
                : "เกิดข้อผิดพลาดในการ import รายวิชา"
            );
          } finally {
            setLoading(false);
          }
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          alert("ไม่สามารถอ่านไฟล์ CSV ได้");
          setLoading(false);
        },
      });
    } catch (error) {
      console.error("Error:", error);
      alert("เกิดข้อผิดพลาด");
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `ID,Course Code,Title (TH),Title (EN),Description,Categories,Course Types,Learning Outcomes,Target Audience,Assessment Criteria,Content Structure,Development Year,Prerequisites,Institution,Instructor,Level,Duration (Hours),Teaching Language,Has Certificate,Enroll Count,Image URL,Banner Image URL,Video URL,Course URL,Tags,Created At,Updated At
course-001,CS101,"การเขียนโปรแกรม Python เบื้องต้น","Introduction to Python Programming","เรียนรู้พื้นฐานการเขียนโปรแกรม Python ตั้งแต่เริ่มต้น เหมาะสำหรับผู้ที่ไม่มีพื้นฐานการเขียนโปรแกรม","04,02","General Education","เข้าใจพื้นฐานภาษา Python,สามารถเขียนโปรแกรมเบื้องต้นได้,เข้าใจโครงสร้างข้อมูลพื้นฐาน","นักเรียน นักศึกษา ผู้ที่สนใจเรียนโปรแกรมมิ่ง","เข้าเรียน 80%, สอบผ่าน 60%","บทนำ,ตัวแปร,ลูป,ฟังก์ชัน",2025,"ไม่ต้องมีพื้นฐาน","Changhua Christian Hospital","John Doe",beginner,40,Thai,Yes,150,https://openedu.mooc.thai.net/wp-content/uploads/2024/09/cropped-openedu-c-logo.png,,"https://youtube.com/watch?v=example","https://example.com/courses/python-intro","python,programming,beginner,coding",2025-01-15T08:00:00.000Z,2025-01-15T08:00:00.000Z
course-002,DEV102,"การพัฒนาเว็บด้วย React","Web Development with React","เรียนรู้การสร้างเว็บแอปพลิเคชันด้วย React.js แบบ step-by-step","04","Specific Skills","สร้าง Web App ด้วย React ได้,เข้าใจ Component-based Architecture,ใช้งาน React Hooks ได้","นักศึกษาสายไอที นักพัฒนาเว็บ","ส่งงานครบทุกชิ้น","Introduction to React,Components,State & Props,Hooks",2025,"พื้นฐาน HTML CSS JavaScript","Microsoft Thailand","Jane Smith",intermediate,60,Thai,Yes,230,https://openedu.mooc.thai.net/wp-content/uploads/2024/09/cropped-openedu-c-logo.png,,"https://youtube.com/watch?v=example2","https://example.com/courses/react","react,web,javascript,frontend",2025-01-15T08:00:00.000Z,2025-01-15T08:00:00.000Z
course-003,DATA201,"Data Science ด้วย Python","Data Science with Python","เรียนรู้การวิเคราะห์ข้อมูลและ Machine Learning ด้วย Python","04,02","Professional","วิเคราะห์ข้อมูลด้วย Pandas,สร้างโมเดล Machine Learning,Visualize ข้อมูลด้วย Matplotlib","นักวิเคราะห์ข้อมูล Data Scientist ผู้สนใจ AI","สอบ Final 100%","Data Preprocessing,Modeling,Evaluation",2025,"พื้นฐาน Python และ คณิตศาสตร์","National Cheng Kung University","Dr. Alan Wang",advanced,80,English,No,95,https://openedu.mooc.thai.net/wp-content/uploads/2024/09/cropped-openedu-c-logo.png,,,"","python,datascience,ai,machinelearning",2025-01-15T08:00:00.000Z,2025-01-15T08:00:00.000Z`;

    // Add BOM for UTF-8 to ensure Thai characters display correctly in Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "course-import-template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Courses from CSV</DialogTitle>
          <DialogDescription>
            อัปโหลดไฟล์ CSV เพื่อนำเข้ารายวิชาหลายรายการพร้อมกัน
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={downloadTemplate}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              ดาวน์โหลดไฟล์ตัวอย่าง CSV
            </Button>
            <p className="text-sm text-muted-foreground">
              ดาวน์โหลดไฟล์ตัวอย่างเพื่อดูรูปแบบที่ถูกต้อง
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="csv-file"
              className="block text-sm font-medium text-gray-700"
            >
              เลือกไฟล์ CSV
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90"
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                ไฟล์ที่เลือก: {file.name}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="encoding-mode"
              checked={useThaiEncoding}
              onCheckedChange={(checked) => setUseThaiEncoding(checked as boolean)}
            />
            <Label htmlFor="encoding-mode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              ใช้การเข้ารหัสภาษาไทย (Windows-874 / TIS-620)
            </Label>
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            ทำเครื่องหมายถ้า Import แล้วพบภาษาต่างดาว (สำหรับไฟล์จาก Excel ภาษาไทย)
          </p>

          {result && (
            <div className="space-y-2">
              <Alert variant={result.failed === 0 ? "default" : "destructive"}>
                <div className="flex items-start gap-2">
                  {result.failed === 0 ? (
                    <CheckCircle className="h-4 w-4 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <AlertDescription>
                      <div className="font-semibold mb-2">
                        นำเข้าสำเร็จ: {result.success} รายการ | ล้มเหลว:{" "}
                        {result.failed} รายการ
                      </div>
                      {result.errors.length > 0 && (
                        <div className="space-y-1">
                          <div className="font-medium text-sm">ข้อผิดพลาด:</div>
                          <ul className="list-disc list-inside text-sm space-y-0.5 max-h-40 overflow-y-auto">
                            {result.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            </div>
          )}

          <div className="bg-muted p-4 rounded-md">
            <h4 className="text-sm font-semibold mb-2">คำแนะนำ:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
              <li>ไฟล์ CSV ต้องมี header ตรงกับตัวอย่าง (27 คอลัมน์)</li>
              <li>
                <strong>ฟิลด์ที่จำเป็น:</strong> Title (TH), Title (EN), Description เท่านั้น
              </li>
              <li>ฟิลด์อื่นๆ สามารถเว้นว่างได้ทั้งหมด</li>
              <li>
                <strong>ID</strong> จะถูกสร้างอัตโนมัติถ้าไม่ระบุ
              </li>
              <li>
                <strong>Categories</strong> แยกด้วยเครื่องหมายจุลภาค (เช่น 04,02)
              </li>
              <li>
                <strong>Has Certificate</strong> ใช้ค่า Yes หรือ No
              </li>
              <li>
                <strong>Institution</strong> และ <strong>Instructor</strong> ใช้ชื่อหรือเว้นว่าง
              </li>
              <li>
                <strong>Level</strong> ใช้ค่า: beginner, intermediate, advanced
              </li>
              <li>
                <strong>Teaching Language</strong> ใช้ค่า: Thai, English, bilingual
              </li>
              <li>Learning Outcomes, Target Audience แยกข้อความด้วยจุลภาค</li>
              <li>Created At, Updated At จะใช้เวลาปัจจุบันถ้าไม่ระบุ</li>
              <li>
                <strong>💡 Tip:</strong> ใช้ Export CSV เพื่อดูตัวอย่างข้อมูลที่ถูกต้อง
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            ปิด
          </Button>
          <Button onClick={handleImport} disabled={!file || loading}>
            {loading ? "กำลัง Import..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
