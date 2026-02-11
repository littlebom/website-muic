// Data Models

export interface Course {
  id: string;
  courseCode?: string | null;
  title: string;
  titleEn: string;
  description: string;
  learningOutcomes?: string | null;
  targetAudience?: string | null;
  prerequisites?: string | null;
  tags?: string | null;
  assessmentCriteria?: string | null;
  courseUrl?: string | null;
  videoUrl?: string | null;
  contentStructure?: string | null;
  categoryIds?: string[];
  courseTypeIds?: string[];
  institutionId?: string | null;
  instructorId?: string | null;
  imageId?: string | null;
  bannerImageId?: string | null;
  level?: string | null;
  teachingLanguage?: string | null;
  durationHours?: number | null;
  developmentYear?: number | null;
  hasCertificate: boolean;
  enrollCount: number;
  isPopular?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseCategory {
  courseId: string;
  categoryId: string;
}

export interface CourseCourseType {
  courseId: string;
  courseTypeId: string;
}

export interface CourseCourseInstructor {
  courseId: string;
  instructorId: string;
}

export interface CourseWithRelations extends Course {
  courseCategories?: CourseCategory[];
  courseCourseTypes?: CourseCourseType[];
  courseInstructors?: CourseCourseInstructor[];
  course_categories?: CourseCategory[]; // For backward compatibility with some raw queries
  course_course_types?: CourseCourseType[]; // For backward compatibility with some raw queries
  course_instructors?: CourseCourseInstructor[]; // For backward compatibility with some raw queries
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  cached?: boolean;
}

export interface ContentTopic {
  id: string;
  title: string;
  subtopics: string[];
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseType {
  id: string;
  name: string;
  nameEn: string;
  icon?: string | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Instructor {
  id: string;
  name: string;
  nameEn: string;
  title: string;
  institutionId: string;
  bio?: string | null;
  imageUrl?: string | null;
  email?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Institution {
  id: string;
  name: string;
  nameEn: string;
  abbreviation: string;
  logoUrl: string;
  website?: string | null;
  mapUrl?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  address?: string | null;
  addressEn?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  socialLinks?: any | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  micrositeEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface News {
  id: string;
  title: string;
  content: string;
  imageId: string;
  institutionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Banner {
  id: string;
  title: string;
  titleEn: string;
  subtitle?: string | null;
  subtitleEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  buttonText?: string | null;
  buttonTextEn?: string | null;
  imageId: string;
  backgroundImageId?: string | null;
  overlayImageId?: string | null;
  linkUrl?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  accentColor?: string | null;
  isActive: boolean;
  order: number;
  templateId?: string | null;
  institutionId?: string | null;
  showSearchBox?: boolean;
  overlayOpacity?: number;
  linkTarget?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  menuId: string;
  label: string;
  labelEn?: string | null;
  url: string;
  parentId?: string | null;
  order: number;
  target?: string;
  children?: MenuItem[]; // For recursive structure in UI
  createdAt: Date;
  updatedAt: Date;
}

export interface Menu {
  id: string;
  name: string;
  position: string;
  institutionId: string;
  isActive: boolean;
  items?: MenuItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WebAppSettings {
  id: string;
  siteName: string;
  siteLogo: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  addressEn?: string | null;
  aboutUs?: string | null;
  aboutUsEn?: string | null;
  mapUrl?: string | null;
  facebookUrl?: string | null;
  twitterUrl?: string | null;
  youtubeUrl?: string | null;
  instagramUrl?: string | null;
  lineUrl?: string | null;
  geminiApiKey?: string | null;
  preloaderEnabled?: boolean;
  preloaderTitle?: string | null;
  preloaderSubtitle?: string | null;
  preloaderPrimaryColor?: string | null;
  preloaderSecondaryColor?: string | null;
  preloaderBackgroundColor?: string | null;
  defaultCourseThumbnail?: string | null;
  defaultInstitutionLogo?: string | null;
  defaultNewsImage?: string | null;
  chatbotEnabled?: boolean;
  lineQrCodeUrl?: string | null;
  lineOfficialId?: string | null;
  classroomUrl?: string | null;
  footerLogo?: string | null;
  // SMTP Configuration
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUsername?: string | null;
  smtpPassword?: string | null;
  smtpFromEmail?: string | null;
  smtpFromName?: string | null;
  smtpSecure?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImagePlaceholder {
  id: string;
  url: string;
  title: string;
  category: "course" | "banner" | "news" | "instructor" | "institution" | "general";
}

export interface Popup {
  id: string;
  title: string;
  titleEn: string;
  description?: string | null;
  descriptionEn?: string | null;
  imageId: string;
  linkUrl?: string | null;
  buttonText?: string | null;
  buttonTextEn?: string | null;
  isActive: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  displayOrder: number;
  showOnce: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type Language = "th" | "en";

export type AdminRole = 'super_admin' | 'institution_admin' | 'admin';

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  institutionId?: string | null;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseSkills {
  id: string;
  courseId: string;
  // Hard Skills
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  h5: number;
  h6: number;
  // Soft Skills
  s1: number;
  s2: number;
  s3: number;
  s4: number;
  s5: number;
  s6: number;

  reasoning?: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Guide {
  id: string;
  title: string;
  content: string;
  category: string | null;
  keywords: string | null;
  is_active: number | boolean;
  view_count: number;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
}
