import {
    Category,
    Institution,
    CourseType,
    Banner,
    News,
    Course,
    CourseWithRelations,
    Instructor
} from "@/lib/types";

export const MOCK_CATEGORIES: Category[] = [
    {
        id: 'cat-1',
        name: 'เทคโนโลยี',
        nameEn: 'Technology',
        icon: 'Cpu',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'cat-2',
        name: 'ธุรกิจ',
        nameEn: 'Business',
        icon: 'Briefcase',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'cat-3',
        name: 'การออกแบบ',
        nameEn: 'Design',
        icon: 'Palette',
        createdAt: new Date(),
        updatedAt: new Date()
    },
];

export const MOCK_INSTITUTIONS: Institution[] = [
    {
        id: 'inst-1',
        name: 'จุฬาลงกรณ์มหาวิทยาลัย',
        nameEn: 'Chulalongkorn University',
        abbreviation: 'CU',
        logoUrl: '/uploads/cu-logo.png',
        description: 'Leading university',
        website: 'https://chula.ac.th',
        micrositeEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'inst-2',
        name: 'มหาวิทยาลัยมหิดล',
        nameEn: 'Mahidol University',
        abbreviation: 'MU',
        logoUrl: '/uploads/mu-logo.png',
        description: 'Medical and research',
        website: 'https://mahidol.ac.th',
        micrositeEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
];

export const MOCK_COURSE_TYPES: CourseType[] = [
    {
        id: 'type-1',
        name: 'MOOC',
        nameEn: 'MOOC',
        description: 'Massive Open Online Course',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'type-2',
        name: 'SPOC',
        nameEn: 'SPOC',
        description: 'Small Private Online Course',
        createdAt: new Date(),
        updatedAt: new Date()
    },
];

export const MOCK_BANNERS: Banner[] = [
    {
        id: 'banner-1',
        title: 'ยินดีต้อนรับสู่ MUIC',
        titleEn: 'Welcome to MUIC',
        imageId: 'banner-img-1',
        linkUrl: '/courses',
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'banner-2',
        title: 'คอร์สเรียน AI ใหม่',
        titleEn: 'New AI Courses',
        imageId: 'banner-img-2',
        linkUrl: '/courses/ai',
        order: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
];

export const MOCK_NEWS: News[] = [
    {
        id: 'news-1',
        title: 'แจ้งปิดปรับปรุงระบบ',
        content: 'ระบบจะทำการปิดปรับปรุงในวันอาทิตย์นี้...',
        imageId: 'news-img-1',
        createdAt: new Date(),
        updatedAt: new Date()
    },
];

export const MOCK_INSTRUCTORS: Instructor[] = [
    {
        id: 'instr-1',
        name: 'ดร. สมชาย',
        nameEn: 'Dr. Somchai',
        title: 'Professor',
        institutionId: 'inst-1',
        email: 'somchai@example.com',
        bio: 'Expert in AI',
        imageUrl: 'https://placehold.co/200',
        createdAt: new Date(),
        updatedAt: new Date()
    },
];

export const MOCK_COURSES: Course[] = [
    {
        id: 'c-1',
        title: 'พื้นฐานภาษา Python',
        titleEn: 'Introduction to Python',
        description: 'เรียนรู้การเขียนโปรแกรม Python ตั้งแต่เริ่มต้น',
        learningOutcomes: 'เขียนโปรแกรมพื้นฐานได้',
        courseCode: 'PY101',
        durationHours: 10,
        level: 'Beginner',
        teachingLanguage: 'Thai',
        institutionId: 'inst-1',
        enrollCount: 1500,
        hasCertificate: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'c-2',
        title: 'การตลาดดิจิทัลขั้นสูง',
        titleEn: 'Digital Marketing Mastery',
        description: 'เจาะลึกกลยุทธ์การตลาดออนไลน์',
        learningOutcomes: 'วางแผนการตลาดได้',
        courseCode: 'MKT202',
        durationHours: 8,
        level: 'Intermediate',
        teachingLanguage: 'Thai',
        institutionId: 'inst-2',
        enrollCount: 800,
        hasCertificate: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

export const MOCK_COURSES_WITH_RELATIONS: CourseWithRelations[] = MOCK_COURSES.map(c => ({
    ...c,
    courseCategories: [{ courseId: c.id, categoryId: 'cat-1' }],
    courseCourseTypes: [{ courseId: c.id, courseTypeId: 'type-1' }],
    courseInstructors: [{ courseId: c.id, instructorId: 'instr-1' }],
    course_categories: [{ courseId: c.id, categoryId: 'cat-1' }],
    course_course_types: [{ courseId: c.id, courseTypeId: 'type-1' }],
    course_instructors: [{ courseId: c.id, instructorId: 'instr-1' }]
}));
