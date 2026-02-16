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
      Papa.parse(file as any, {
        header: true,
        skipEmptyLines: 'greedy',
        encoding: useThaiEncoding ? 'windows-874' : 'utf-8',
        complete: async (results) => {
          try {
            console.log("Parsed CSV headers:", results.meta.fields);
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

            // If completely successful, close dialog and reload to refresh client-side state
            if (data.results.failed === 0) {
              setTimeout(() => {
                setOpen(false);
                window.location.reload();
              }, 1500);
            }
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
    const headers = [
      'ID',
      'Course Code',
      'Title (TH)',
      'Title (EN)',
      'Description',
      'Categories',
      'Course Types',
      'Learning Outcomes',
      'Target Audience',
      'Prerequisites',
      'Institution',
      'Instructor',
      'Level',
      'Duration (Hours)',
      'Teaching Language',
      'Has Certificate',
      'Enroll Count',
      'Image URL',
      'Banner Image URL',
      'Video URL',
      'Course URL',
      'Tags',
      'Created At',
      'Updated At',
      'Assessment Criteria',
      'Content Structure',
      'Development Year',
      'Hard Skills',
      'Soft Skills'
    ];

    const sampleData = [
      [
        '"course-1769756680849-8"',
        '"MUIC009"',
        '"Climate Crisis The Whats and the Whys"',
        '"Climate Crisis The Whats and the Whys"',
        '"The course Climate Crisis: The Whats and the Whys will introduce learners to the basics of global warming and climate change. Learners will also become aware of the causes and consequences of climate change. It will then generate the learners’ knowledge and understanding of the severity of specific human actions and activities that have resulted in the current state of the climate crisis. Finally, the course will allow learners to partake in a discussion on the potential solutions in addressing the climate crisis."',
        '"02"',
        '""',
        '"[""Explain the principles of global warming, climate change, and the climate crisis. "",""Describe the causes and consequences of the climate crisis."",""Explore options to address the climate crisis. Participate in constructive group discussions.""]"',
        '"Pre-College/University students"',
        '"None"',
        '"วิทยาลัยนานาชาติ มหาวิทยาลัยมหิดล"',
        '"Ramesh Boonratana"',
        '"Beginner"',
        '"12"',
        '"English"',
        '"Yes"',
        '"5"',
        '"/uploads/courses/course-ml0k8ave.jpg?t=1769758018826"',
        '""',
        '"https://www.youtube.com/watch?v=D3ZBPLot1Ek"',
        '"https://muiclms.mahidol.ac.th/courses/course-v1:MUIC+009+1/about"',
        '"Climate Crisis, global warming"',
        '"2026-01-30T07:04:40.849Z"',
        '"2026-01-30T08:05:16.706Z"',
        '"70"',
        '""',
        '"2026"',
        '""',
        '""'
      ].join(','),
      [
        '"course-1769756680848-5"',
        '"MUIC006"',
        '"Tourism and Hospitality Management 4.0"',
        '"Tourism and Hospitality Management 4.0"',
        '"Step into the future of the global travel industry. This course goes beyond the basics to explore how Tourism and Hospitality are evolving in the digital era (Industry 4.0). Students will navigate the entire tourism ecosystem, distinguishing the unique career paths between tourism management and hospitality services.\nThe curriculum emphasizes a holistic approach to Sustainable Tourism, analyzing how the government, private sector, and public communities collaborate to drive development. You will learn to craft cutting-edge business strategies, master the art of service-oriented quality for diverse target markets, and apply Marketing 4.0 principles to create unforgettable, value-driven guest experiences. Prepare to lead the industry with a blend of strategic insight and service excellence."',
        '"09"',
        '""',
        '"[""Students can explain the difference of career in tourism and hospitality industry."",""Students can explain the importance of sustainable tourism and the main elements of Government, Private, Public sector driven forward sustainable tourism development."",""Students can explain the principles of further business development in tourism and Hospitality."",""Students can explain the business strategy for tourism and hospitality.""]"',
        '"Undergraduate students"',
        '"None"',
        '"วิทยาลัยนานาชาติ มหาวิทยาลัยมหิดล"',
        '"Kaewta Muangasame"',
        '"Beginner"',
        '"12"',
        '"English"',
        '"Yes"',
        '"2"',
        '"/uploads/courses/course-ml0klfgn.jpg?t=1769758631303"',
        '""',
        '"https://www.youtube.com/watch?v=QXe8I5SMRhw"',
        '"https://muiclms.mahidol.ac.th/courses/course-v1:MUIC+006+1/about"',
        '"Tourism"',
        '"2026-01-30T07:04:40.848Z"',
        '"2026-01-30T07:37:29.522Z"',
        '"70"',
        '""',
        '"2026"',
        '""',
        '""'
      ].join(','),
      [
        '"course-1769756680848-6"',
        '"MUIC007"',
        '"Science for Life"',
        '"Science for Life"',
        '"รายวิชานี้ นำเสนอถึงความสำคัญของความรู้พื้นฐานของหัวข้อในทางฟิสิกส์ เคมี ชีววิทยา และคณิตศาสตร์ ที่มีต่อเทคโนโลยี และ ชีวิตประจำวันในยุคปัจจุบัน เช่น การใช้หน่วย ที่มาของพลังงาน ยาและวัคซีนเพื่อสุขภาพ และ การใช้คณิตศาสตร์เพื่ออธิบาย สถิติ การออกแบบ และการสั่งงานด้วยเสียง"',
        '"02"',
        '""',
        '"[""ผู้เรียนสามารถคำนวณการเปลี่ยนหน่วยได้อย่างถูกต้อง และอธิบายถึงความสำคัญของความแม่นยำในการวัด"",""ผู้เรียนสามารถคำนวณพลังงานที่ใช้ในชีวิตประจำวัน และเข้าใจถึงที่มาของพลังงานในปัจจุบัน และอนาคต"",""ผู้เรียนสามารถอธิบายถึงกระบวนการพัฒนาเทคโนโลยีเพื่อสุขภาพ"",""ผู้เรียนสามารถประยุกต์ใช้คณิตศาสตร์เพื่อแก้ปัญหาในชีวิตประจำวันได้""]"',
        '"นักเรียน นักศึกษา และประชาชนทั่วไป"',
        '""',
        '"วิทยาลัยนานาชาติ มหาวิทยาลัยมหิดล"',
        '"Kaewta Muangasame"',
        '"Beginner"',
        '"12"',
        '"Thai"',
        '"Yes"',
        '"2"',
        '"/uploads/courses/course-ml0kumgs.jpg?t=1769759060284"',
        '""',
        '"https://www.youtube.com/watch?v=bEJIuuApXbE"',
        '"https://muiclms.mahidol.ac.th/courses/course-v1:MUIC+007+1/about"',
        '"วิทยาศาสตร์, physics, chemistry"',
        '"2026-01-30T07:04:40.848Z"',
        '"2026-02-11T04:02:23.108Z"',
        '"70%"',
        '""',
        '"2026"',
        '""',
        '""'
      ].join(','),
      [
        '"course-1769756680846-3"',
        '"MUIC004"',
        '"Non-verbal communication Skills in Public Speaking"',
        '"Non-verbal communication Skills in Public Speaking"',
        '"Great ideas deserve a great delivery. Whether you are a student preparing for a thesis defense or a professional leading a boardroom pitch, the way you present is just as important as what you say.\n""Presence & Impact"" is a dynamic mini-course designed to transform your public speaking skills through the power of non-verbal communication. Across a series of short, high-impact videos, you will learn how to channel nervous energy into confidence, command the room with your posture, and use your voice as a precision instrument.\nStop hiding behind your slides. It’s time to step into the spotlight and deliver your message with authority, authenticity, and style."',
        '"09"',
        '""',
        '"[""How to make the best use of posture to convey a message"",""How to make use of one’s voice for better delivery"",""How to use hands and facial expressions"",""How to interact with the slides and the audience during a presentation""]"',
        '"Undergraduate students, Graduate students"',
        '"None"',
        '"วิทยาลัยนานาชาติ มหาวิทยาลัยมหิดล"',
        '"Kaewta Muangasame"',
        '"Beginner"',
        '"12"',
        '"English"',
        '"Yes"',
        '"3"',
        '"/uploads/courses/course-ml0l6p19.jpg?t=1769759623485"',
        '""',
        '"https://www.youtube.com/watch?v=H8x-Gs3RzT4"',
        '"https://muiclms.mahidol.ac.th/courses/course-v1:MUIC+004+1/about"',
        '""',
        '"2026-01-30T07:04:40.847Z"',
        '"2026-02-11T04:12:14.265Z"',
        '"70"',
        '""',
        '"2026"',
        '""',
        '""'
      ].join(',')
    ];

    const csvContent = headers.join(',') + '\n' + sampleData.join('\n');

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
