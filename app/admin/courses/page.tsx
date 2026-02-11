"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Download } from "lucide-react";
import { CoursesList } from "@/components/admin/courses-list";
import { CourseImportDialog } from "@/components/admin/course-import-dialog";
import type { Course, CourseWithRelations, Category, Instructor, Institution, CourseType } from "@/lib/types";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        console.log('[Admin Courses] Starting to fetch data...');
        const [coursesRes, categoriesRes, instructorsRes, institutionsRes, skillsRes] = await Promise.all([
          fetch('/api/courses').then(r => r.json()),
          fetch('/api/categories').then(r => r.json()),
          fetch('/api/instructors').then(r => r.json()),
          fetch('/api/institutions').then(r => r.json()),
          fetch('/api/course-types').then(r => r.json()),
          fetch('/api/courses/skills').then(r => r.json()),
        ]);

        console.log('[Admin Courses] Courses response:', {
          success: coursesRes.success,
          dataLength: coursesRes.data?.length,
          hasData: !!coursesRes.data
        });
        console.log('[Admin Courses] Categories:', categoriesRes.data?.length);
        console.log('[Admin Courses] Instructors:', instructorsRes.data?.length);
        console.log('[Admin Courses] Institutions:', institutionsRes.data?.length);

        // Helper to extract data from response (handle both {data: [...]} and [...])
        const getData = (res: any) => Array.isArray(res) ? res : (res.data || []);

        setCourses(getData(coursesRes));
        setCategories(getData(categoriesRes));
        setInstructors(getData(instructorsRes));
        setInstitutions(getData(institutionsRes));
        setSkills(getData(skillsRes));
      } catch (error) {
        console.error('[Admin Courses] Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const exportToCSV = () => {
    // Prepare CSV headers
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
      'Content Structure', // Moved to end
      'Hard Skills',       // Moved to end
      'Soft Skills'        // Moved to end
    ];

    // Prepare CSV rows
    const rows = courses.map(course => {
      const institution = institutions.find(i => i.id === course.institutionId);
      const instructor = instructors.find(i => i.id === course.instructorId);
      const skillAnalysis = skills.find(s => s.courseId === course.id);

      // Get category IDs for this course
      const courseWithRelations = course as CourseWithRelations;
      const courseCategories = courseWithRelations.courseCategories || [];
      const categoryIds = courseCategories
        .map((cc) => cc.categoryId)
        .filter(Boolean)
        .join(',');

      // Get course types for this course
      const courseTypesList = courseWithRelations.courseCourseTypes || []; // Adjust based on actual relation name in your type
      const courseTypeNames = courseTypesList
        .map(ct => {
          const match = courseTypes.find(t => t.id === ct.courseTypeId);
          return match ? match.name : '';
        })
        .filter(Boolean)
        .join(',');

      // Format Skills
      let hardSkillsStr = '';
      let softSkillsStr = '';
      if (skillAnalysis) {
        try {
          // Hard Skills
          const hard = typeof skillAnalysis.hardSkills === 'string'
            ? JSON.parse(skillAnalysis.hardSkills)
            : skillAnalysis.hardSkills;
          hardSkillsStr = Object.entries(hard || {})
            .map(([k, v]) => `${k}:${v}`)
            .join('; ');

          // Soft Skills
          const soft = typeof skillAnalysis.softSkills === 'string'
            ? JSON.parse(skillAnalysis.softSkills)
            : skillAnalysis.softSkills;
          softSkillsStr = Object.entries(soft || {})
            .map(([k, v]) => `${k}:${v}`)
            .join('; ');
        } catch (e) {
          console.error('Error parsing skills for CSV', e);
        }
      }

      return [
        course.id,
        `"${(course.courseCode || '').replace(/"/g, '""')}"`,
        `"${(course.title || '').replace(/"/g, '""')}"`,
        `"${(course.titleEn || '').replace(/"/g, '""')}"`,
        `"${(course.description || '').replace(/"/g, '""')}"`,
        categoryIds || '',
        `"${courseTypeNames.replace(/"/g, '""')}"`,
        `"${(course.learningOutcomes || '').replace(/"/g, '""')}"`,
        `"${(course.targetAudience || '').replace(/"/g, '""')}"`,
        `"${(course.prerequisites || '').replace(/"/g, '""')}"`,
        `"${institution ? institution.name : ''}"`,
        `"${instructor ? instructor.name : ''}"`,
        course.level || '',
        course.durationHours || 0,
        course.teachingLanguage || '',
        course.hasCertificate ? 'Yes' : 'No',
        course.enrollCount || 0,
        course.imageId || '',
        course.bannerImageId || '',
        course.videoUrl || '',
        course.courseUrl || '',
        `"${(course.tags || '').replace(/"/g, '""')}"`,
        new Date(course.createdAt).toISOString(),
        new Date(course.updatedAt).toISOString(),
        `"${(course.contentStructure || '').replace(/"/g, '""')}"`, // Content Structure
        `"${hardSkillsStr.replace(/"/g, '""')}"`,                 // Hard Skills
        `"${softSkillsStr.replace(/"/g, '""')}"`                  // Soft Skills
      ].join(',');
    });

    // Combine headers and rows
    const csv = [headers.join(','), ...rows].join('\n');

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `courses_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up to prevent memory leak
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Courses</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">Manage all courses</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={courses.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <CourseImportDialog />
          <Button asChild>
            <Link href="/admin/courses/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Courses ({courses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <CoursesList
            initialCourses={courses}
            categories={categories}
            instructors={instructors}
            institutions={institutions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
