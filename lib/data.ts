import { query, queryOne, execute } from "./mysql-direct";
import * as types from "./types";

// Re-export database functions for direct use
export { query, queryOne, execute };

// Categories
export async function getCategories(): Promise<types.Category[]> {
  return await query<types.Category>(
    'SELECT * FROM categories ORDER BY createdAt DESC'
  );
}

// Course Types
export async function getCourseTypes(): Promise<types.CourseType[]> {
  return await query<types.CourseType>(
    'SELECT * FROM course_types ORDER BY createdAt DESC'
  );
}

export async function getCategoryById(id: string): Promise<types.Category | null> {
  return await queryOne<types.Category>(
    'SELECT * FROM categories WHERE id = ?',
    [id]
  );
}

export async function createCategory(data: Omit<types.Category, "id" | "createdAt" | "updatedAt">): Promise<types.Category> {
  const id = `cat-${Date.now()}`;
  await execute(
    'INSERT INTO categories (id, name, nameEn, icon, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
    [id, data.name, data.nameEn, data.icon]
  );
  return (await getCategoryById(id))!;
}

export async function updateCategory(id: string, data: Partial<types.Category>): Promise<types.Category | null> {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.nameEn) {
    updates.push('nameEn = ?');
    values.push(data.nameEn);
  }
  if (data.icon) {
    updates.push('icon = ?');
    values.push(data.icon);
  }

  if (updates.length === 0) return await getCategoryById(id);

  updates.push('updatedAt = NOW()');
  values.push(id);

  const result = await execute(
    `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  return result.affectedRows > 0 ? await getCategoryById(id) : null;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM categories WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// Institutions
export async function getInstitutions(): Promise<types.Institution[]> {
  return await query<types.Institution>(
    'SELECT * FROM institutions ORDER BY createdAt DESC'
  );
}

export async function getInstitutionById(id: string): Promise<types.Institution | null> {
  return await queryOne<types.Institution>(
    'SELECT * FROM institutions WHERE id = ?',
    [id]
  );
}

export async function createInstitution(data: Omit<types.Institution, "id" | "createdAt" | "updatedAt">): Promise<types.Institution> {
  const id = `inst-${Date.now()}`;
  await execute(
    'INSERT INTO institutions (id, name, nameEn, abbreviation, logoUrl, website, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
    [id, data.name, data.nameEn, data.abbreviation, data.logoUrl, data.website || null, data.description || null]
  );
  return (await getInstitutionById(id))!;
}

export async function updateInstitution(id: string, data: Partial<types.Institution>): Promise<types.Institution | null> {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.nameEn) {
    updates.push('nameEn = ?');
    values.push(data.nameEn);
  }
  if (data.abbreviation) {
    updates.push('abbreviation = ?');
    values.push(data.abbreviation);
  }
  if (data.logoUrl) {
    updates.push('logoUrl = ?');
    values.push(data.logoUrl);
  }
  if (data.website !== undefined) {
    updates.push('website = ?');
    values.push(data.website);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }

  if (updates.length === 0) return await getInstitutionById(id);

  updates.push('updatedAt = NOW()');
  values.push(id);

  const result = await execute(
    `UPDATE institutions SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  return result.affectedRows > 0 ? await getInstitutionById(id) : null;
}

export async function deleteInstitution(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM institutions WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// Instructors
export async function getInstructors(institutionId?: string): Promise<types.Instructor[]> {
  if (institutionId) {
    return await query<types.Instructor>(
      'SELECT * FROM instructors WHERE institutionId = ? ORDER BY createdAt DESC',
      [institutionId]
    );
  }
  return await query<types.Instructor>(
    'SELECT * FROM instructors ORDER BY createdAt DESC'
  );
}

export async function getInstructorById(id: string): Promise<types.Instructor | null> {
  return await queryOne<types.Instructor>(
    'SELECT * FROM instructors WHERE id = ?',
    [id]
  );
}

export async function createInstructor(data: Omit<types.Instructor, "id" | "createdAt" | "updatedAt">): Promise<types.Instructor> {
  const id = `instr-${Date.now()}`;
  await execute(
    'INSERT INTO instructors (id, name, nameEn, title, institutionId, bio, imageUrl, email, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
    [id, data.name, data.nameEn, data.title, data.institutionId, data.bio || null, data.imageUrl || null, data.email || null]
  );
  return (await getInstructorById(id))!;
}

export async function updateInstructor(id: string, data: Partial<types.Instructor>): Promise<types.Instructor | null> {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.nameEn) {
    updates.push('nameEn = ?');
    values.push(data.nameEn);
  }
  if (data.title) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.institutionId) {
    updates.push('institutionId = ?');
    values.push(data.institutionId);
  }
  if (data.bio !== undefined) {
    updates.push('bio = ?');
    values.push(data.bio);
  }
  if (data.imageUrl !== undefined) {
    updates.push('imageUrl = ?');
    values.push(data.imageUrl);
  }
  if (data.email !== undefined) {
    updates.push('email = ?');
    values.push(data.email);
  }

  if (updates.length === 0) return await getInstructorById(id);

  updates.push('updatedAt = NOW()');
  values.push(id);

  const result = await execute(
    `UPDATE instructors SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  return result.affectedRows > 0 ? await getInstructorById(id) : null;
}

export async function deleteInstructor(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM instructors WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// Courses
export async function getCourses(): Promise<types.Course[]> {
  const courses = await query<any>(
    `SELECT c.*,
     GROUP_CONCAT(DISTINCT cc.categoryId) as categoryIds
     FROM courses c
     LEFT JOIN course_categories cc ON c.id = cc.courseId
     GROUP BY c.id
     ORDER BY c.createdAt DESC`
  );

  return courses.map(course => ({
    ...course,
    categoryIds: course.categoryIds ? course.categoryIds.split(',') : [],
  }));
}

export async function getCourseById(id: string): Promise<types.Course | null> {
  const course = await queryOne<any>(
    `SELECT c.*,
     GROUP_CONCAT(DISTINCT cc.categoryId) as categoryIds,
     GROUP_CONCAT(DISTINCT cct.courseTypeId) as courseTypeIds
     FROM courses c
     LEFT JOIN course_categories cc ON c.id = cc.courseId
     LEFT JOIN course_course_types cct ON c.id = cct.courseId
     WHERE c.id = ?
     GROUP BY c.id`,
    [id]
  );

  if (!course) return null;

  return {
    ...course,
    categoryIds: course.categoryIds ? course.categoryIds.split(',') : [],
    courseTypeIds: course.courseTypeIds ? course.courseTypeIds.split(',') : [],
  } as types.Course;
}

export async function createCourse(data: Omit<types.Course, "id" | "createdAt" | "updatedAt">): Promise<types.Course> {
  const id = `course-${Date.now()}`;
  await execute(
    'INSERT INTO courses (id, title, titleEn, description, institutionId, instructorId, imageId, level, durationHours, hasCertificate, enrollCount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
    [id, data.title, data.titleEn, data.description, data.institutionId || null, data.instructorId || null, data.imageId || null, data.level || null, data.durationHours || null, data.hasCertificate || false, data.enrollCount || 0]
  );
  return (await getCourseById(id))!;
}

export async function updateCourse(id: string, data: Partial<types.Course>): Promise<types.Course | null> {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.title) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.titleEn) {
    updates.push('titleEn = ?');
    values.push(data.titleEn);
  }
  if (data.description) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.institutionId !== undefined) {
    updates.push('institutionId = ?');
    values.push(data.institutionId);
  }
  if (data.instructorId !== undefined) {
    updates.push('instructorId = ?');
    values.push(data.instructorId);
  }
  if (data.imageId !== undefined) {
    updates.push('imageId = ?');
    values.push(data.imageId);
  }
  if (data.level !== undefined) {
    updates.push('level = ?');
    values.push(data.level);
  }
  if (data.durationHours !== undefined) {
    updates.push('durationHours = ?');
    values.push(data.durationHours);
  }
  if (data.hasCertificate !== undefined) {
    updates.push('hasCertificate = ?');
    values.push(data.hasCertificate);
  }
  if (data.enrollCount !== undefined) {
    updates.push('enrollCount = ?');
    values.push(data.enrollCount);
  }

  if (updates.length === 0) return await getCourseById(id);

  updates.push('updatedAt = NOW()');
  values.push(id);

  const result = await execute(
    `UPDATE courses SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  return result.affectedRows > 0 ? await getCourseById(id) : null;
}

export async function deleteCourse(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM courses WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// News
export async function getNews(institutionId?: string): Promise<types.News[]> {
  if (institutionId) {
    return await query<types.News>(
      'SELECT * FROM news WHERE institutionId = ? ORDER BY createdAt DESC',
      [institutionId]
    );
  }
  return await query<types.News>(
    'SELECT * FROM news ORDER BY createdAt DESC'
  );
}

export async function getNewsById(id: string): Promise<types.News | null> {
  return await queryOne<types.News>(
    'SELECT * FROM news WHERE id = ?',
    [id]
  );
}

export async function createNews(data: Omit<types.News, "id" | "createdAt" | "updatedAt">): Promise<types.News> {
  const id = `news-${Date.now()}`;
  await execute(
    'INSERT INTO news (id, title, content, imageId, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
    [id, data.title, data.content, data.imageId]
  );
  return (await getNewsById(id))!;
}

export async function updateNews(id: string, data: Partial<types.News>): Promise<types.News | null> {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.title) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.content) {
    updates.push('content = ?');
    values.push(data.content);
  }
  if (data.imageId) {
    updates.push('imageId = ?');
    values.push(data.imageId);
  }

  if (updates.length === 0) return await getNewsById(id);

  updates.push('updatedAt = NOW()');
  values.push(id);

  const result = await execute(
    `UPDATE news SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  return result.affectedRows > 0 ? await getNewsById(id) : null;
}

export async function deleteNews(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM news WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// Banners
export async function getBanners(institutionId?: string): Promise<types.Banner[]> {
  if (institutionId) {
    return await query<types.Banner>(
      'SELECT * FROM banners WHERE institutionId = ? ORDER BY `order` ASC',
      [institutionId]
    );
  }
  return await query<types.Banner>(
    'SELECT * FROM banners ORDER BY `order` ASC'
  );
}

export async function getBannerById(id: string): Promise<types.Banner | null> {
  return await queryOne<types.Banner>(
    'SELECT * FROM banners WHERE id = ?',
    [id]
  );
}

export async function createBanner(data: Omit<types.Banner, "id" | "createdAt" | "updatedAt">): Promise<types.Banner> {
  const id = `banner-${Date.now()}`;
  await execute(
    'INSERT INTO banners (id, title, titleEn, subtitle, subtitleEn, imageId, linkUrl, isActive, `order`, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
    [id, data.title, data.titleEn, data.subtitle || null, data.subtitleEn || null, data.imageId, data.linkUrl || null, data.isActive ?? true, data.order ?? 0]
  );
  return (await getBannerById(id))!;
}

export async function updateBanner(id: string, data: Partial<types.Banner>): Promise<types.Banner | null> {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.title) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.titleEn) {
    updates.push('titleEn = ?');
    values.push(data.titleEn);
  }
  if (data.subtitle !== undefined) {
    updates.push('subtitle = ?');
    values.push(data.subtitle);
  }
  if (data.subtitleEn !== undefined) {
    updates.push('subtitleEn = ?');
    values.push(data.subtitleEn);
  }
  if (data.imageId) {
    updates.push('imageId = ?');
    values.push(data.imageId);
  }
  if (data.linkUrl !== undefined) {
    updates.push('linkUrl = ?');
    values.push(data.linkUrl);
  }
  if (data.isActive !== undefined) {
    updates.push('isActive = ?');
    values.push(data.isActive);
  }
  if (data.order !== undefined) {
    updates.push('`order` = ?');
    values.push(data.order);
  }

  if (updates.length === 0) return await getBannerById(id);

  updates.push('updatedAt = NOW()');
  values.push(id);

  const result = await execute(
    `UPDATE banners SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  return result.affectedRows > 0 ? await getBannerById(id) : null;
}

export async function deleteBanner(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM banners WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// Settings
export async function getSettings(): Promise<types.WebAppSettings> {
  const settings = await queryOne<types.WebAppSettings>(
    'SELECT * FROM webapp_settings LIMIT 1'
  );

  if (!settings) {
    // Return default settings
    return {
      id: "",
      siteName: "MUIC",
      siteLogo: "",
      contactEmail: "contact@thaimooc.ac.th",
      contactPhone: "02-123-4567",
      address: "กรุงเทพมหานคร ประเทศไทย",
      aboutUs: null,
      aboutUsEn: null,
      mapUrl: null,
      facebookUrl: null,
      twitterUrl: null,
      youtubeUrl: null,
      instagramUrl: null,
      lineUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return settings;
}

export async function updateSettings(data: Partial<types.WebAppSettings>): Promise<types.WebAppSettings> {
  console.log('[updateSettings] Data received:', JSON.stringify(data, null, 2)); // Debug log
  let settings = await queryOne<types.WebAppSettings>(
    'SELECT * FROM webapp_settings LIMIT 1'
  );

  if (!settings) {
    // Create new settings
    const id = `settings-${Date.now()}`;
    await execute(
      'INSERT INTO webapp_settings (id, siteName, siteLogo, contactEmail, contactPhone, address, aboutUs, aboutUsEn, mapUrl, facebookUrl, twitterUrl, youtubeUrl, instagramUrl, lineUrl, geminiApiKey, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [
        id,
        data.siteName || "MUIC",
        data.siteLogo || "",
        data.contactEmail || "contact@thaimooc.ac.th",
        data.contactPhone || "02-123-4567",
        data.address || "กรุงเทพมหานคร ประเทศไทย",
        data.aboutUs || null,
        data.aboutUsEn || null,
        data.mapUrl || null,
        data.facebookUrl || null,
        data.twitterUrl || null,
        data.youtubeUrl || null,
        data.instagramUrl || null,
        data.instagramUrl || null,
        data.lineUrl || null,
        data.geminiApiKey || null,
      ]
    );
    settings = (await queryOne<types.WebAppSettings>(
      'SELECT * FROM webapp_settings WHERE id = ?',
      [id]
    ))!;
  } else {
    // Update existing settings
    const updates: string[] = [];
    const values: any[] = [];

    if (data.siteName !== undefined) {
      updates.push('siteName = ?');
      values.push(data.siteName);
    }
    if (data.siteLogo !== undefined) {
      updates.push('siteLogo = ?');
      values.push(data.siteLogo);
    }
    if (data.contactEmail !== undefined) {
      updates.push('contactEmail = ?');
      values.push(data.contactEmail);
    }
    if (data.contactPhone !== undefined) {
      updates.push('contactPhone = ?');
      values.push(data.contactPhone);
    }
    if (data.address !== undefined) {
      updates.push('address = ?');
      values.push(data.address);
    }
    if (data.aboutUs !== undefined) {
      updates.push('aboutUs = ?');
      values.push(data.aboutUs);
    }
    if (data.aboutUsEn !== undefined) {
      updates.push('aboutUsEn = ?');
      values.push(data.aboutUsEn);
    }
    if (data.mapUrl !== undefined) {
      updates.push('mapUrl = ?');
      values.push(data.mapUrl);
    }
    if (data.facebookUrl !== undefined) {
      updates.push('facebookUrl = ?');
      values.push(data.facebookUrl);
    }
    if (data.twitterUrl !== undefined) {
      updates.push('twitterUrl = ?');
      values.push(data.twitterUrl);
    }
    if (data.youtubeUrl !== undefined) {
      updates.push('youtubeUrl = ?');
      values.push(data.youtubeUrl);
    }
    if (data.instagramUrl !== undefined) {
      updates.push('instagramUrl = ?');
      values.push(data.instagramUrl);
    }
    if (data.lineUrl !== undefined) {
      updates.push('lineUrl = ?');
      values.push(data.lineUrl);
    }
    if (data.geminiApiKey !== undefined) {
      updates.push('geminiApiKey = ?');
      values.push(data.geminiApiKey);
    }
    // SMTP Configuration
    if (data.smtpHost !== undefined) {
      updates.push('smtpHost = ?');
      values.push(data.smtpHost);
    }
    if (data.smtpPort !== undefined) {
      updates.push('smtpPort = ?');
      values.push(data.smtpPort);
    }
    if (data.smtpUsername !== undefined) {
      updates.push('smtpUsername = ?');
      values.push(data.smtpUsername);
    }
    if (data.smtpPassword !== undefined) {
      updates.push('smtpPassword = ?');
      values.push(data.smtpPassword);
    }
    if (data.smtpFromEmail !== undefined) {
      updates.push('smtpFromEmail = ?');
      values.push(data.smtpFromEmail);
    }
    if (data.smtpFromName !== undefined) {
      updates.push('smtpFromName = ?');
      values.push(data.smtpFromName);
    }
    if (data.smtpSecure !== undefined) {
      updates.push('smtpSecure = ?');
      values.push(data.smtpSecure);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = NOW()');
      values.push(settings.id);

      await execute(
        `UPDATE webapp_settings SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    settings = (await queryOne<types.WebAppSettings>(
      'SELECT * FROM webapp_settings WHERE id = ?',
      [settings.id]
    ))!;
  }

  return settings;
}

// Image Placeholders
export async function getImagePlaceholders(): Promise<types.ImagePlaceholder[]> {
  const placeholders = await query<types.ImagePlaceholder>(
    'SELECT * FROM image_placeholders'
  );
  return placeholders;
}

export async function getImagePlaceholderById(id: string): Promise<types.ImagePlaceholder | null> {
  return await queryOne<types.ImagePlaceholder>(
    'SELECT * FROM image_placeholders WHERE id = ?',
    [id]
  );
}

// Sync version for utils
export function getImagePlaceholder(imageId: string): types.ImagePlaceholder | null {
  // This is a synchronous placeholder lookup
  // In a real app, you'd want to cache this or use a different approach
  // For now, return null and let the caller handle the fallback
  return null;
}

export async function getInstitutionRelatedFiles(institutionId: string): Promise<string[]> {
  const results = await query<{ url: string }>(
    `SELECT imageId as url FROM courses WHERE institutionId = ? AND imageId IS NOT NULL
     UNION
     SELECT imageUrl as url FROM instructors WHERE institutionId = ? AND imageUrl IS NOT NULL
     UNION
     SELECT imageId as url FROM news WHERE institutionId = ? AND imageId IS NOT NULL
     UNION
     SELECT imageId as url FROM banners WHERE institutionId = ? AND imageId IS NOT NULL
     UNION
     SELECT logoUrl as url FROM institutions WHERE id = ? AND logoUrl IS NOT NULL`,
    [institutionId, institutionId, institutionId, institutionId, institutionId]
  );

  return results.map(r => r.url);
}

// Guides
export async function getGuides(options: { active?: boolean, category?: string, search?: string, limit?: number, offset?: number } = {}): Promise<types.Guide[]> {
  const { active, category, search, limit = 100, offset = 0 } = options;
  let whereClause = "1=1";
  const params: any[] = [];

  if (active) {
    whereClause += " AND is_active = TRUE";
  }
  if (category) {
    whereClause += " AND category = ?";
    params.push(category);
  }
  if (search) {
    whereClause += " AND (title LIKE ? OR content LIKE ? OR keywords LIKE ?)";
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const sql = `SELECT id, title, content, category, keywords, is_active, view_count, created_by, created_at, updated_at FROM guides WHERE ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

  return await query<types.Guide>(sql, params);
}
