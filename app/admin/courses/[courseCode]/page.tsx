"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { CourseForm } from "@/components/admin/course-form";
import { CourseSkillCard } from "@/components/course/course-skill-card";
import { ContentStructureEditor } from "@/components/admin/content-structure-editor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Course, Category, CourseType, Instructor, Institution, ContentTopic } from "@/lib/types";

import { BookOpen, Sparkles, Settings, ChevronDown, ChevronUp } from "lucide-react";

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ courseCode: string }>;
}) {
  const [courseId, setCourseId] = useState<string>("");
  const [course, setCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadData() {
      const { courseCode } = await params;
      // Note: We don't set courseId here yet, we wait for the API response to get the real UUID

      try {
        console.log('[Edit Course] Starting to fetch data for course:', courseCode);
        const [courseRes, categoriesRes, courseTypesRes, instructorsRes, institutionsRes] = await Promise.all([
          fetch(`/api/courses/${courseCode}`).then(r => r.json()),
          fetch('/api/categories').then(r => r.json()),
          fetch('/api/course-types').then(r => r.json()),
          fetch('/api/instructors').then(r => r.json()),
          fetch('/api/institutions').then(r => r.json()),
        ]);

        console.log('[Edit Course] Responses:', {
          course: !!courseRes.data,
          categories: categoriesRes.data?.length,
          courseTypes: courseTypesRes.data?.length,
          instructors: instructorsRes.data?.length,
          institutions: institutionsRes.data?.length,
        });

        if (!courseRes.data) {
          notFound();
        }

        // Set the real UUID for child components
        setCourseId(courseRes.data.id);

        // Parse JSON fields and extract IDs from relations
        const courseData = {
          ...courseRes.data,
          learningOutcomes: courseRes.data.learningOutcomes
            ? (typeof courseRes.data.learningOutcomes === 'string'
              ? JSON.parse(courseRes.data.learningOutcomes)
              : courseRes.data.learningOutcomes)
            : [],
          contentStructure: courseRes.data.contentStructure
            ? (typeof courseRes.data.contentStructure === 'string'
              ? JSON.parse(courseRes.data.contentStructure)
              : courseRes.data.contentStructure)
            : [],
          // Extract categoryIds from course_categories relation
          categoryIds: courseRes.data.course_categories
            ? courseRes.data.course_categories.map((cc: any) => cc.categoryId)
            : [],
          // Extract courseTypeIds from course_course_types relation
          courseTypeIds: courseRes.data.course_course_types
            ? courseRes.data.course_course_types.map((ct: any) => ct.courseTypeId)
            : [],
          // Extract instructorId from course_instructors relation (for backward compatibility)
          instructorId: courseRes.data.course_instructors && courseRes.data.course_instructors.length > 0
            ? courseRes.data.course_instructors[0].instructorId
            : courseRes.data.instructorId,
        };

        console.log('[Edit Course] Parsed course data:', {
          categoryIds: courseData.categoryIds,
          courseTypeIds: courseData.courseTypeIds,
          instructorId: courseData.instructorId,
          institutionId: courseData.institutionId,
        });

        // Helper to extract data from response (handle both {data: [...]} and [...])
        const getData = (res: any) => Array.isArray(res) ? res : (res.data || []);

        setCourse(courseData);
        setCategories(getData(categoriesRes));
        setCourseTypes(getData(courseTypesRes));
        setInstructors(getData(instructorsRes));
        setInstitutions(getData(institutionsRes));
      } catch (error) {
        console.error("[Edit Course] Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params]);

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Edit Course</h1>
        <p className="text-muted-foreground">Update course information and manage content</p>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Basic Information
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Content Structure
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Skill Analysis
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Basic Information */}
        <TabsContent value="basic" className="mt-6">
          <CourseForm
            course={course}
            categories={categories}
            courseTypes={courseTypes}
            instructors={instructors}
            institutions={institutions}
          />
        </TabsContent>

        {/* Tab 2: Content Structure */}
        <TabsContent value="content" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Structure</CardTitle>
              <CardDescription>
                Manage the course content structure and topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContentStructureEditor
                courseId={courseId}
                initialContent={(course.contentStructure as unknown as ContentTopic[]) || []}
                onSave={(updatedContent: ContentTopic[]) => {
                  // Update local state after save
                  setCourse({ ...course, contentStructure: updatedContent as any });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: AI Skill Analysis */}
        <TabsContent value="skills" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Skill Analysis</CardTitle>
              <CardDescription>
                View and regenerate AI-powered skill analysis for this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseSkillCard courseId={courseId} showRefreshButton={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
