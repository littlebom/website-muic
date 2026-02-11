"use server";

import { revalidatePath } from "next/cache";
import {
  createCourse,
  updateCourse,
  deleteCourse,
  createCategory,
  updateCategory,
  deleteCategory,
  createInstructor,
  updateInstructor,
  deleteInstructor,
  createInstitution,
  updateInstitution,
  deleteInstitution,
  createNews,
  updateNews,
  deleteNews,
  createBanner,
  updateBanner,
  deleteBanner,
  updateSettings,
} from "./data";
import type {
  Course,
  Category,
  Instructor,
  Institution,
  News,
  Banner,
  WebAppSettings,
} from "./types";

// Course Actions
export async function createCourseAction(
  data: Omit<Course, "id" | "createdAt" | "updatedAt">
) {
  try {
    const course = await createCourse(data);
    revalidatePath("/admin/courses");
    revalidatePath("/courses");
    revalidatePath("/");
    return { success: true, data: course };
  } catch (error) {
    return { success: false, error: "Failed to create course" };
  }
}

export async function updateCourseAction(id: string, data: Partial<Course>) {
  try {
    const course = await updateCourse(id, data);
    if (!course) {
      return { success: false, error: "Course not found" };
    }
    revalidatePath("/admin/courses");
    revalidatePath(`/courses/${id}`);
    revalidatePath("/courses");
    revalidatePath("/");
    return { success: true, data: course };
  } catch (error) {
    return { success: false, error: "Failed to update course" };
  }
}

export async function deleteCourseAction(id: string) {
  try {
    const result = await deleteCourse(id);
    if (!result) {
      return { success: false, error: "Course not found" };
    }
    revalidatePath("/admin/courses");
    revalidatePath("/courses");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete course" };
  }
}

// Category Actions
export async function createCategoryAction(
  data: Omit<Category, "id" | "createdAt" | "updatedAt">
) {
  try {
    const category = await createCategory(data);
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { success: true, data: category };
  } catch (error) {
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategoryAction(
  id: string,
  data: Partial<Category>
) {
  try {
    const category = await updateCategory(id, data);
    if (!category) {
      return { success: false, error: "Category not found" };
    }
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { success: true, data: category };
  } catch (error) {
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    const result = await deleteCategory(id);
    if (!result) {
      return { success: false, error: "Category not found" };
    }
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete category" };
  }
}

// Instructor Actions
export async function createInstructorAction(
  data: Omit<Instructor, "id" | "createdAt" | "updatedAt">
) {
  try {
    const instructor = await createInstructor(data);
    revalidatePath("/admin/instructors");
    return { success: true, data: instructor };
  } catch (error) {
    return { success: false, error: "Failed to create instructor" };
  }
}

export async function updateInstructorAction(
  id: string,
  data: Partial<Instructor>
) {
  try {
    const instructor = await updateInstructor(id, data);
    if (!instructor) {
      return { success: false, error: "Instructor not found" };
    }
    revalidatePath("/admin/instructors");
    return { success: true, data: instructor };
  } catch (error) {
    return { success: false, error: "Failed to update instructor" };
  }
}

export async function deleteInstructorAction(id: string) {
  try {
    const result = await deleteInstructor(id);
    if (!result) {
      return { success: false, error: "Instructor not found" };
    }
    revalidatePath("/admin/instructors");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete instructor" };
  }
}

// Institution Actions
export async function createInstitutionAction(
  data: Omit<Institution, "id" | "createdAt" | "updatedAt">
) {
  try {
    const institution = await createInstitution(data);
    revalidatePath("/admin/institutions");
    revalidatePath("/institutions");
    return { success: true, data: institution };
  } catch (error) {
    return { success: false, error: "Failed to create institution" };
  }
}

export async function updateInstitutionAction(
  id: string,
  data: Partial<Institution>
) {
  try {
    const institution = await updateInstitution(id, data);
    if (!institution) {
      return { success: false, error: "Institution not found" };
    }
    revalidatePath("/admin/institutions");
    revalidatePath("/institutions");
    return { success: true, data: institution };
  } catch (error) {
    return { success: false, error: "Failed to update institution" };
  }
}

export async function deleteInstitutionAction(id: string) {
  try {
    const result = await deleteInstitution(id);
    if (!result) {
      return { success: false, error: "Institution not found" };
    }
    revalidatePath("/admin/institutions");
    revalidatePath("/institutions");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete institution" };
  }
}

// News Actions
export async function createNewsAction(
  data: Omit<News, "id" | "createdAt" | "updatedAt">
) {
  try {
    const newsItem = await createNews(data);
    revalidatePath("/admin/news");
    revalidatePath("/news");
    revalidatePath("/");
    return { success: true, data: newsItem };
  } catch (error) {
    return { success: false, error: "Failed to create news" };
  }
}

export async function updateNewsAction(id: string, data: Partial<News>) {
  try {
    const newsItem = await updateNews(id, data);
    if (!newsItem) {
      return { success: false, error: "News not found" };
    }
    revalidatePath("/admin/news");
    revalidatePath(`/news/${id}`);
    revalidatePath("/news");
    revalidatePath("/");
    return { success: true, data: newsItem };
  } catch (error) {
    return { success: false, error: "Failed to update news" };
  }
}

export async function deleteNewsAction(id: string) {
  try {
    const result = await deleteNews(id);
    if (!result) {
      return { success: false, error: "News not found" };
    }
    revalidatePath("/admin/news");
    revalidatePath("/news");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete news" };
  }
}

// Banner Actions
export async function createBannerAction(
  data: Omit<Banner, "id" | "createdAt" | "updatedAt">
) {
  try {
    const banner = await createBanner(data);
    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { success: true, data: banner };
  } catch (error) {
    return { success: false, error: "Failed to create banner" };
  }
}

export async function updateBannerAction(id: string, data: Partial<Banner>) {
  try {
    const banner = await updateBanner(id, data);
    if (!banner) {
      return { success: false, error: "Banner not found" };
    }
    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { success: true, data: banner };
  } catch (error) {
    return { success: false, error: "Failed to update banner" };
  }
}

export async function deleteBannerAction(id: string) {
  try {
    const result = await deleteBanner(id);
    if (!result) {
      return { success: false, error: "Banner not found" };
    }
    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete banner" };
  }
}

// Settings Actions
export async function updateSettingsAction(data: Partial<WebAppSettings>) {
  try {
    const settings = await updateSettings(data);
    revalidatePath("/admin/settings");
    revalidatePath("/contact");
    return { success: true, data: settings };
  } catch (error) {
    return { success: false, error: "Failed to update settings" };
  }
}
