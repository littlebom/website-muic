import { query, queryOne, execute, SqlParams } from "@/lib/mysql-direct";
import { redisCache } from "@/lib/redis-cache";
import {
    Category,
    Institution,
    CourseType,
    Banner,
    News,
    Course,
    CourseWithRelations,
    CourseCategory,
    CourseCourseType,
    Instructor
} from "@/lib/types";

// Cache TTLs (in seconds)
const TTL = {
    LONG: 15 * 60,   // 15 minutes for static data (categories, institutions)
    MEDIUM: 5 * 60,  // 5 minutes for courses
    SHORT: 2 * 60,   // 2 minutes for news, banners
};

export async function getCategories(): Promise<Category[]> {
    console.log('[DEBUG] getCategories START');
    console.log('[DEBUG] Env USE_MOCK_DATA:', process.env.USE_MOCK_DATA);
    // console.log('[DEBUG] DB Config:', process.env.DATABASE_URL ? 'URL Set' : 'URL Missing');
    if (process.env.USE_MOCK_DATA === 'true') {
        const { MOCK_CATEGORIES } = await import('@/lib/mock-data');
        return MOCK_CATEGORIES;
    }

    const cacheKey = 'categories:all';
    const cached = await redisCache.get<Category[]>(cacheKey);
    if (cached) return cached;

    const categories = await query<Category>('SELECT * FROM categories ORDER BY createdAt DESC');

    // Only cache valid data to prevent poisoning
    if (categories.length > 0) {
        await redisCache.set(cacheKey, categories, { ttl: TTL.LONG });
    }
    return categories;
}

export async function getInstitutions(): Promise<Institution[]> {
    if (process.env.USE_MOCK_DATA === 'true') {
        const { MOCK_INSTITUTIONS } = await import('@/lib/mock-data');
        return MOCK_INSTITUTIONS;
    }

    const cacheKey = 'institutions:all';
    const cached = await redisCache.get<Institution[]>(cacheKey);
    if (cached) return cached;

    const institutions = await query<Institution>('SELECT * FROM institutions ORDER BY createdAt DESC');
    await redisCache.set(cacheKey, institutions, { ttl: TTL.LONG });
    return institutions;
}

export async function getCourseTypes(): Promise<CourseType[]> {
    if (process.env.USE_MOCK_DATA === 'true') {
        const { MOCK_COURSE_TYPES } = await import('@/lib/mock-data');
        return MOCK_COURSE_TYPES;
    }

    const cacheKey = 'course-types:all';
    const cached = await redisCache.get<CourseType[]>(cacheKey);
    if (cached) return cached;

    const types = await query<CourseType>('SELECT * FROM course_types ORDER BY createdAt DESC');
    await redisCache.set(cacheKey, types, { ttl: TTL.LONG });
    return types;
}

export async function getInstructors(): Promise<Instructor[]> {
    if (process.env.USE_MOCK_DATA === 'true') {
        const { MOCK_INSTRUCTORS } = await import('@/lib/mock-data');
        return MOCK_INSTRUCTORS;
    }

    const cacheKey = 'instructors:all';
    const cached = await redisCache.get<Instructor[]>(cacheKey);
    if (cached) return cached;

    const instructors = await query<Instructor>('SELECT * FROM instructors ORDER BY createdAt DESC');
    await redisCache.set(cacheKey, instructors, { ttl: TTL.LONG });
    return instructors;
}

export async function getBanners(activeOnly = true, institutionId: string | null = null): Promise<Banner[]> {
    if (process.env.USE_MOCK_DATA === 'true') {
        const { MOCK_BANNERS } = await import('@/lib/mock-data');
        let banners = activeOnly ? MOCK_BANNERS.filter(b => b.isActive) : MOCK_BANNERS;

        if (institutionId) {
            banners = banners.filter(b => b.institutionId === institutionId);
        } else {
            banners = banners.filter(b => !b.institutionId);
        }

        return banners;
    }

    const cacheKey = `banners:${activeOnly ? 'active' : 'all'}:${institutionId || 'global'}`;
    const cached = await redisCache.get<Banner[]>(cacheKey);
    if (cached) return cached;

    let sql = 'SELECT * FROM banners';
    const params: SqlParams = [];
    const conditions: string[] = [];

    if (activeOnly) {
        conditions.push('isActive = ?');
        params.push(true);
    }

    if (institutionId) {
        conditions.push('institutionId = ?');
        params.push(institutionId);
    } else {
        conditions.push('institutionId IS NULL');
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY `order` ASC';

    const banners = await query<Banner>(sql, params);
    await redisCache.set(cacheKey, banners, { ttl: TTL.SHORT });
    return banners;
}

export async function getNews(limit?: number, institutionId?: string): Promise<News[]> {
    if (process.env.USE_MOCK_DATA === 'true') {
        const { MOCK_NEWS } = await import('@/lib/mock-data');
        let news = MOCK_NEWS;
        if (institutionId) {
            news = news.filter(n => n.institutionId === institutionId);
        } else {
            // Filter for global news only (no institutionId)
            news = news.filter(n => !n.institutionId);
        }
        return limit ? news.slice(0, limit) : news;
    }

    const cacheKey = `news:${limit || 'all'}:${institutionId || 'global'}`;
    const cached = await redisCache.get<News[]>(cacheKey);
    if (cached) return cached;

    let sql = 'SELECT * FROM news';
    const params: SqlParams = [];

    if (institutionId) {
        sql += ' WHERE institutionId = ?';
        params.push(institutionId);
    } else {
        // Filter for global news only
        sql += ' WHERE institutionId IS NULL';
    }

    sql += ' ORDER BY createdAt DESC';

    if (limit && typeof limit === 'number') {
        sql += ` LIMIT ${limit}`;
    }

    const news = await query<News>(sql, params);
    await redisCache.set(cacheKey, news, { ttl: TTL.SHORT });
    return news;
}

interface CourseQueryParams {
    limit?: number;
    sort?: 'newest' | 'popular';
    categoryId?: string;
    institutionId?: string;
    level?: string;
    isPopular?: boolean;
}

export async function getCourses(params: CourseQueryParams = {}): Promise<CourseWithRelations[]> {
    if (process.env.USE_MOCK_DATA === 'true') {
        const { MOCK_COURSES_WITH_RELATIONS } = await import('@/lib/mock-data');
        let courses = [...MOCK_COURSES_WITH_RELATIONS];

        if (params.categoryId) {
            courses = courses.filter(c => c.courseCategories?.some(cc => cc.categoryId === params.categoryId));
        }
        if (params.institutionId) {
            courses = courses.filter(c => c.institutionId === params.institutionId);
        }
        if (params.isPopular) {
            courses = courses.filter(c => c.isPopular);
        }
        if (params.limit) {
            courses = courses.slice(0, params.limit);
        }

        return courses;
    }

    const { limit, sort, categoryId, institutionId, level, isPopular } = params;
    const cacheKey = `courses:${categoryId || 'all'}:${institutionId || 'all'}:${level || 'all'}:${isPopular !== undefined ? isPopular : 'all'}:${limit || 'all'}:${sort || 'default'}`;

    const cached = await redisCache.get<CourseWithRelations[]>(cacheKey);
    if (cached && Array.isArray(cached)) return cached;

    // Build WHERE clause
    const whereConditions: string[] = [];
    const sqlParams: SqlParams = [];

    if (categoryId) {
        whereConditions.push('c.id IN (SELECT courseId FROM course_categories WHERE categoryId = ?)');
        sqlParams.push(categoryId);
    }
    if (institutionId) {
        whereConditions.push('c.institutionId = ?');
        sqlParams.push(institutionId);
    }
    if (level) {
        whereConditions.push('c.level = ?');
        sqlParams.push(level);
    }
    if (isPopular !== undefined) {
        whereConditions.push('c.isPopular = ?');
        sqlParams.push(isPopular);
    }

    const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

    // Build ORDER BY clause
    let orderByClause = 'ORDER BY c.createdAt DESC';
    if (sort === 'popular') {
        // Sort by isPopular (pinned) first, then by enrollCount (organic popularity)
        orderByClause = 'ORDER BY c.isPopular DESC, c.enrollCount DESC, c.createdAt DESC';
    } else if (sort === 'newest') {
        orderByClause = 'ORDER BY c.createdAt DESC';
    }

    // Build LIMIT clause
    const limitClause = limit ? `LIMIT ${limit}` : '';

    // Fetch courses
    const courses = await query<Course>(
        `SELECT * FROM courses c ${whereClause} ${orderByClause} ${limitClause}`,
        sqlParams
    );

    if (courses.length === 0) {
        await redisCache.set(cacheKey, [], { ttl: TTL.MEDIUM });
        return [];
    }

    // Fetch relations
    const courseIds = courses.map(c => c.id);
    const placeholders = courseIds.map(() => '?').join(',');

    const [allCategories, allCourseTypes] = await Promise.all([
        query<{ courseId: string; categoryId: string }>(
            `SELECT courseId, categoryId FROM course_categories WHERE courseId IN (${placeholders})`,
            courseIds
        ),
        query<{ courseId: string; courseTypeId: string }>(
            `SELECT courseId, courseTypeId FROM course_course_types WHERE courseId IN (${placeholders})`,
            courseIds
        )
    ]);

    // Map relations
    const categoriesMap = new Map<string, CourseCategory[]>();
    const courseTypesMap = new Map<string, CourseCourseType[]>();

    allCategories.forEach(item => {
        if (!categoriesMap.has(item.courseId)) categoriesMap.set(item.courseId, []);
        categoriesMap.get(item.courseId)!.push({ courseId: item.courseId, categoryId: item.categoryId });
    });

    allCourseTypes.forEach(item => {
        if (!courseTypesMap.has(item.courseId)) courseTypesMap.set(item.courseId, []);
        courseTypesMap.get(item.courseId)!.push({ courseId: item.courseId, courseTypeId: item.courseTypeId });
    });

    // Attach relations
    const result: CourseWithRelations[] = courses.map(course => {
        const categories = categoriesMap.get(course.id) || [];
        const types = courseTypesMap.get(course.id) || [];
        return {
            ...course,
            courseCategories: categories,
            courseCourseTypes: types,
            // Backward compatibility
            course_categories: categories,
            course_course_types: types,
        };
    });

    await redisCache.set(cacheKey, result, { ttl: TTL.MEDIUM });
    return result;
}

export async function getCourseById(idOrCode: string): Promise<CourseWithRelations | null> {
    if (process.env.USE_MOCK_DATA === 'true') {
        const { MOCK_COURSES_WITH_RELATIONS } = await import('@/lib/mock-data');
        return MOCK_COURSES_WITH_RELATIONS.find(c => c.id === idOrCode || c.courseCode === idOrCode) || null;
    }

    const cacheKey = `course:${idOrCode}`;
    const cached = await redisCache.get<CourseWithRelations>(cacheKey);
    if (cached) return cached;

    const course = await queryOne<Course>('SELECT * FROM courses WHERE id = ? OR courseCode = ?', [idOrCode, idOrCode]);

    if (!course) {
        return null;
    }

    const id = course.id;

    // Fetch relations
    const [categories, types, instructors] = await Promise.all([
        query<{ courseId: string; categoryId: string }>(
            'SELECT courseId, categoryId FROM course_categories WHERE courseId = ?',
            [id]
        ),
        query<{ courseId: string; courseTypeId: string }>(
            'SELECT courseId, courseTypeId FROM course_course_types WHERE courseId = ?',
            [id]
        ),
        query<{ courseId: string; instructorId: string }>(
            'SELECT courseId, instructorId FROM course_instructors WHERE courseId = ?',
            [id]
        )
    ]);

    const result: CourseWithRelations = {
        ...course,
        courseCategories: categories.map(c => ({ courseId: c.courseId, categoryId: c.categoryId })),
        courseCourseTypes: types.map(t => ({ courseId: t.courseId, courseTypeId: t.courseTypeId })),
        // Backward compatibility
        course_categories: categories.map(c => ({ courseId: c.courseId, categoryId: c.categoryId })),
        course_course_types: types.map(t => ({ courseId: t.courseId, courseTypeId: t.courseTypeId })),
        courseInstructors: instructors.map(i => ({ courseId: i.courseId, instructorId: i.instructorId })),
        course_instructors: instructors.map(i => ({ courseId: i.courseId, instructorId: i.instructorId })),
    };

    await redisCache.set(cacheKey, result, { ttl: TTL.MEDIUM });
    return result;
}

export async function incrementCourseView(id: string) {
    if (process.env.USE_MOCK_DATA === 'true') {
        return;
    }
    await execute('UPDATE courses SET enrollCount = enrollCount + 1 WHERE id = ?', [id]);
    // We don't need to invalidate cache immediately for view count as it's not critical
}
