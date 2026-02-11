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

export function InstitutionImportDialog() {
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
            const response = await fetch("/api/institutions/import", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                institutions: results.data,
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || "Failed to import institutions");
            }

            setResult(data.results);
            router.refresh();
          } catch (error) {
            console.error("Error importing institutions:", error);
            alert(
              error instanceof Error
                ? error.message
                : "เกิดข้อผิดพลาดในการ import สถาบัน"
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
    const csvContent = `name,nameEn,abbreviation,logoUrl,website,description
"มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี","King Mongkut's University of Technology Thonburi","KMUTT","https://www.kmutt.ac.th/wp-content/uploads/2020/01/logo-kmutt.png","https://www.kmutt.ac.th","มหาวิทยาลัยชั้นนำด้านวิทยาศาสตร์และเทคโนโลยี มุ่งเน้นการผลิตบุคลากรที่มีคุณภาพสูง"
"จุฬาลงกรณ์มหาวิทยาลัย","Chulalongkorn University","CU","https://www.chula.ac.th/wp-content/uploads/2018/11/chula-logo.png","https://www.chula.ac.th","มหาวิทยาลัยแห่งแรกและแห่งเก่าแก่ที่สุดของประเทศไทย"
"มหาวิทยาลัยเชียงใหม่","Chiang Mai University","CMU","https://www.cmu.ac.th/assets/uploads/logo/logo-cmu.png","https://www.cmu.ac.th","มหาวิทยาลัยชั้นนำในภาคเหนือของประเทศไทย เน้นการวิจัยและพัฒนา"
"มหาวิทยาลัยมหิดล","Mahidol University","MU","https://mahidol.ac.th/images/logo-mu.png","https://mahidol.ac.th","มหาวิทยาลัยชั้นนำด้านสาธารณสุข วิทยาศาสตร์ และการแพทย์"
"มหาวิทยาลัยธรรมศาสตร์","Thammasat University","TU","https://www.tu.ac.th/images/logo-tu.png","https://www.tu.ac.th","มหาวิทยาลัยชั้นนำด้านนิติศาสตร์ รัฐศาสตร์ และสังคมศาสตร์"
"สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง","King Mongkut's Institute of Technology Ladkrabang","KMITL","https://www.kmitl.ac.th/images/logo-kmitl.png","https://www.kmitl.ac.th","สถาบันการศึกษาด้านวิศวกรรมศาสตร์และเทคโนโลยีชั้นนำของประเทศ"`;

    // Add BOM for UTF-8 to ensure Thai characters display correctly in Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "institution-import-template.csv");
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
          <DialogTitle>Import Institutions from CSV</DialogTitle>
          <DialogDescription>
            อัปโหลดไฟล์ CSV เพื่อนำเข้าข้อมูลสถาบันการศึกษาหลายรายการพร้อมกัน
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
                ฟิลด์ที่จำเป็น: name, nameEn, abbreviation, logoUrl
              </li>
              <li>ฟิลด์เสริม: website, description</li>
              <li>abbreviation ต้องไม่ซ้ำกับที่มีในระบบ</li>
              <li>logoUrl ควรเป็น URL ที่เข้าถึงได้</li>
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
