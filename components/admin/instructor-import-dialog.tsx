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

export function InstructorImportDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
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
        complete: async (results) => {
          try {
            // Send to API
            const response = await fetch("/api/instructors/import", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                instructors: results.data,
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || "Failed to import instructors");
            }

            setResult(data.results);
            router.refresh();
          } catch (error) {
            console.error("Error importing instructors:", error);
            alert(
              error instanceof Error
                ? error.message
                : "เกิดข้อผิดพลาดในการ import อาจารย์"
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
    const csvContent = `name,nameEn,title,institutionId,bio,imageUrl,email
"ดร.สมชาย ใจดี","Dr. Somchai Jaidee","ผู้ช่วยศาสตราจารย์",inst-1,"อาจารย์ประจำภาควิชาวิทยาการคอมพิวเตอร์ มีประสบการณ์สอนมากกว่า 10 ปี เชี่ยวชาญด้านการเขียนโปรแกรมและปัญญาประดิษฐ์","https://example.com/images/somchai.jpg","somchai@university.ac.th"
"ผศ.ดร.วิภา สุขใส","Asst. Prof. Dr. Wipha Suksai","ผู้ช่วยศาสตราจารย์",inst-1,"ผู้เชี่ยวชาญด้านวิทยาศาสตร์ข้อมูลและการเรียนรู้ของเครื่อง ผลงานตีพิมพ์ระดับนานาชาติมากกว่า 20 บทความ","https://example.com/images/wipha.jpg","wipha.s@university.ac.th"
"อ.ประเสริฐ ชัยชนะ","Mr. Prasert Chaichana","อาจารย์",inst-2,"อาจารย์ผู้สอนด้านการพัฒนาเว็บแอปพลิเคชัน มีประสบการณ์ทำงานในอุตสาหกรรม IT มากกว่า 8 ปี","","prasert@tech.ac.th"
"ดร.นภา รักเรียน","Dr. Napha Rakrian","รองศาสตราจารย์",inst-1,"ผู้เชี่ยวชาญด้านวิศวกรรมซอฟต์แวร์และการจัดการโครงการ กรรมการวิชาการหลายสถาบัน","https://example.com/images/napha.jpg","napha.r@university.ac.th"
"อ.สุรชัย เก่งกาจ","Mr. Surachai Kengkaj","อาจารย์พิเศษ",inst-2,"ผู้เชี่ยวชาญด้าน UX/UI Design และ Frontend Development จาก Google Thailand","https://example.com/images/surachai.jpg","surachai@gmail.com"`;

    // Add BOM for UTF-8 to ensure Thai characters display correctly in Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "instructor-import-template.csv");
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
          <DialogTitle>Import Instructors from CSV</DialogTitle>
          <DialogDescription>
            อัปโหลดไฟล์ CSV เพื่อนำเข้าข้อมูลอาจารย์หลายรายการพร้อมกัน
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
              <li>ไฟล์ CSV ต้องมี header ตรงกับตัวอย่าง</li>
              <li>
                ฟิลด์ที่จำเป็น: name, nameEn, title, institutionId
              </li>
              <li>ฟิลด์เสริม: bio, imageUrl, email</li>
              <li>institutionId ต้องเป็น ID ที่มีอยู่ในระบบ</li>
              <li>imageUrl สามารถเว้นว่างได้หากไม่มีรูปภาพ</li>
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
