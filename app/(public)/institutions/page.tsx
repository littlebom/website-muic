"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SafeImage } from "@/components/safe-image";
import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Institution, Course, Instructor } from "@/lib/types";
import { Building2, BookOpen, Users, Search } from "lucide-react";

export default function InstitutionsPage() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      const [institutionsRes, coursesRes, instructorsRes] = await Promise.all([
        fetch('/api/institutions').then(r => r.json()),
        fetch('/api/courses').then(r => r.json()),
        fetch('/api/instructors').then(r => r.json()),
      ]);

      const institutionsList = Array.isArray(institutionsRes) ? institutionsRes : (institutionsRes.data || []);
      const institutionsData = institutionsList.map((i: any) => ({
        ...i,
        createdAt: new Date(i.createdAt),
        updatedAt: new Date(i.updatedAt),
      }));

      const coursesList = Array.isArray(coursesRes) ? coursesRes : (coursesRes.data || []);
      const coursesData = coursesList.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      }));

      const instructorsList = Array.isArray(instructorsRes) ? instructorsRes : (instructorsRes.data || []);
      const instructorsData = instructorsList.map((i: any) => ({
        ...i,
        createdAt: new Date(i.createdAt),
        updatedAt: new Date(i.updatedAt),
      }));

      setInstitutions(institutionsData);
      setCourses(coursesData);
      setInstructors(instructorsData);
    }
    loadData();
  }, []);

  const getCoursesCount = (institutionId: string) => {
    return courses.filter(course => course.institutionId === institutionId).length;
  };

  const getInstructorsCount = (institutionId: string) => {
    return instructors.filter(instructor => instructor.institutionId === institutionId).length;
  };

  // Filter institutions based on search query
  const filteredInstitutions = institutions.filter((institution) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const name = language === "th" ? institution.name : institution.nameEn;
    const abbreviation = institution.abbreviation || "";
    return (
      name.toLowerCase().includes(searchLower) ||
      abbreviation.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Building2 className="h-10 w-10 text-primary" />
        <h1 className="font-bold" style={{ fontSize: "1.25rem" }}>
          {t("สถาบันการศึกษาพันธมิตร", "Partner Institutions")}
        </h1>
      </div>

      {/* Search Box */}
      <div className="mb-8 flex flex-col items-center">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("ค้นหาสถาบัน...", "Search institutions...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {t(
              `พบ ${filteredInstitutions.length} สถาบัน`,
              `Found ${filteredInstitutions.length} institutions`
            )}
          </p>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-8 text-center">
        {t(
          "เรามีความร่วมมือกับสถาบันการศึกษาชั้นนำทั่วประเทศ เพื่อนำเสนอคอร์สเรียนคุณภาพสูงให้กับผู้เรียน",
          "We partner with leading educational institutions nationwide to offer high-quality courses to learners."
        )}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredInstitutions.map((institution) => (
          <a
            key={institution.id}
            href={`/courses?institution=${institution.id}`}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="flex flex-col items-center p-6">
                <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden bg-gray-100">
                  <SafeImage
                    src={institution.logoUrl}
                    alt={language === "th" ? institution.name : institution.nameEn}
                    fill
                    className="object-cover"
                    fallbackType="institution"
                  />
                </div>
                <CardTitle className="text-center text-base mb-1">
                  {language === "th" ? institution.name : institution.nameEn}
                </CardTitle>
                <p className="text-xs text-muted-foreground text-center mb-4">
                  {institution.abbreviation}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{getCoursesCount(institution.id)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{getInstructorsCount(institution.id)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
