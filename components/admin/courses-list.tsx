"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Eye, Search, ArrowUpDown, ChevronUp, ChevronDown, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Course, Category, Instructor, Institution } from "@/lib/types";

interface CoursesListProps {
  initialCourses: Course[];
  categories: Category[];
  instructors: Instructor[];
  institutions: Institution[];
}

export function CoursesList({
  initialCourses,
  categories,
  instructors,
  institutions,
}: CoursesListProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<{ id: string, title: string } | null>(null);

  const getCategoryName = (courseCategories: any[]) => {
    if (!courseCategories || courseCategories.length === 0) return "-";
    const categoryId = courseCategories[0].categoryId;
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Unknown";
  };

  const getInstructorName = (id: string | null | undefined) => {
    if (!id) return "Unknown";
    const instructor = instructors.find((i) => i.id === id);
    return instructor?.name || "Unknown";
  };

  const getInstitutionName = (id: string | null | undefined) => {
    if (!id) return "Unknown";
    const institution = institutions.find((i) => i.id === id);
    return institution?.abbreviation || "Unknown";
  };

  const getLevelBadge = (level: string | null | undefined) => {
    if (!level) return "default";
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      beginner: "default",
      intermediate: "secondary",
      advanced: "destructive",
    };
    return variants[level.toLowerCase()] || "default";
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedCourses = [...courses].filter((course) => {
    const searchLower = searchQuery.toLowerCase();
    const code = ((course as any).courseCode || "").toLowerCase();
    const title = (course.title || "").toLowerCase();
    const titleEn = (course.titleEn || "").toLowerCase();
    const instructor = getInstructorName(course.instructorId).toLowerCase();
    const institution = getInstitutionName(course.institutionId).toLowerCase();

    return (
      code.includes(searchLower) ||
      title.includes(searchLower) ||
      titleEn.includes(searchLower) ||
      instructor.includes(searchLower) ||
      institution.includes(searchLower)
    );
  }).sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    let aValue: any = "";
    let bValue: any = "";

    switch (key) {
      case "code":
        aValue = (a as any).courseCode || "";
        bValue = (b as any).courseCode || "";
        break;
      case "title":
        aValue = a.title || "";
        bValue = b.title || "";
        break;
      case "category":
        aValue = getCategoryName((a as any).courseCategories);
        bValue = getCategoryName((b as any).courseCategories);
        break;
      case "instructor":
        aValue = getInstructorName(a.instructorId);
        bValue = getInstructorName(b.instructorId);
        break;
      case "institution":
        aValue = getInstitutionName(a.institutionId);
        bValue = getInstitutionName(b.institutionId);
        break;
      case "level":
        aValue = a.level || "";
        bValue = b.level || "";
        break;
      case "views":
        aValue = a.enrollCount || 0;
        bValue = b.enrollCount || 0;
        break;
      case "year":
        aValue = a.developmentYear || 0;
        bValue = b.developmentYear || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return direction === "asc" ? -1 : 1;
    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  // ... (delete handlers remain the same) ...
  const handleDeleteClick = (id: string, title: string) => {
    setCourseToDelete({ id, title });
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;

    const id = courseToDelete.id;
    setDeletingId(id);

    // Close dialog immediately to prevent double submission
    setCourseToDelete(null);

    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete course");
      }

      // Remove from local state
      setCourses(courses.filter((course) => course.id !== id));

      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error("Error deleting course:", error);
      alert(
        error instanceof Error
          ? error.message
          : "ไม่สามารถลบรายวิชาได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses, code, instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24 cursor-pointer hover:bg-muted/50" onClick={() => handleSort("code")}>
                <div className="flex items-center">
                  Code <SortIcon columnKey="code" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("title")}>
                <div className="flex items-center">
                  Title <SortIcon columnKey="title" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("category")}>
                <div className="flex items-center">
                  Category <SortIcon columnKey="category" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("institution")}>
                <div className="flex items-center">
                  Institution <SortIcon columnKey="institution" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("views")}>
                <div className="flex items-center">
                  Views <SortIcon columnKey="views" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("year")}>
                <div className="flex items-center">
                  Year <SortIcon columnKey="year" />
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No courses found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-mono text-sm max-w-[6rem] truncate" title={(course as any).courseCode || ""}>
                    {(course as any).courseCode || "-"}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <div>{course.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {course.titleEn}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryName((course as any).courseCategories)}</TableCell>
                  <TableCell>{getInstitutionName(course.institutionId)}</TableCell>
                  <TableCell>{(course.enrollCount || 0).toLocaleString()}</TableCell>
                  <TableCell>{course.developmentYear || "-"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/courses/${(course as any).courseCode || course.id}`} target="_blank" className="flex items-center cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" /> View Course
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/courses/${(course as any).courseCode || course.id}`} className="flex items-center cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" /> Edit Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                          onClick={() => handleDeleteClick(course.id, course.title)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Course
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบรายวิชา</DialogTitle>
            <DialogDescription>
              คุณต้องการลบรายวิชา "{courseToDelete?.title}" หรือไม่?
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseToDelete(null)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              ลบรายวิชา
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
