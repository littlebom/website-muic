import { NextRequest, NextResponse } from "next/server";
import { query, execute, queryOne } from "@/lib/data";

// Gemini API configuration
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent";

// Helper function to get API Key (with DB fallback)
async function fetchGeminiApiKey(): Promise<string | undefined> {
  // 1. Try process.env first (fastest)
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  // 2. Fallback to Database
  try {
    const settings = await queryOne<{ geminiApiKey: string }>(
      'SELECT geminiApiKey FROM webapp_settings LIMIT 1'
    );
    if (settings?.geminiApiKey) {
      // Update process.env for subsequent calls
      process.env.GEMINI_API_KEY = settings.geminiApiKey;
      return settings.geminiApiKey;
    }
  } catch (error) {
    console.error('[Chatbot] Failed to fetch API key from DB:', error);
  }

  return undefined;
}

interface ChatbotRequest {
  message: string;
  conversationId?: string;
  userName?: string;
  userEmail?: string;
}

interface Guide {
  id: string;
  title: string;
  content: string;
  category: string;
  keywords: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  institutionId: string;
}

interface News {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface Institution {
  id: string;
  name: string;
  nameEn: string;
  abbreviation: string;
  description: string;
  website: string;
}

interface Instructor {
  id: string;
  name: string;
  nameEn: string;
  bio: string;
}

interface ChatMessage {
  sender_type: string;
  sender_name: string;
  message: string;
  created_at: string;
}

interface SearchResults {
  guides: Guide[];
  courses: Course[];
  news: News[];
  institutions: Institution[];
  instructors: Instructor[];
}

interface ActionButton {
  type: "support_redirect" | "ask_another";
  label: string;
  url?: string;
  variant?: "primary" | "secondary";
}

/**
 * Use Gemini AI to analyze user query and extract keywords
 * This provides better Thai language understanding than regex
 */
async function analyzeQueryWithGemini(userQuery: string): Promise<string[]> {
  try {
    const apiKey = await fetchGeminiApiKey();
    if (!apiKey) {
      console.log('[Chatbot] GEMINI_API_KEY not found, falling back to regex extraction');
      return extractKeywordsWithRegex(userQuery);
    }

    const analysisPrompt = `วิเคราะห์คำถามต่อไปนี้และแยกคำสำคัญ(keywords) ที่ใช้ค้นหาข้อมูลในฐานข้อมูลรายวิชาออนไลน์

คำถาม: "${userQuery}"

📋 คำสั่ง:
1. แยกคำสำคัญที่เกี่ยวข้องกับ: หัวข้อวิชา, เทคโนโลยี, ทักษะ, ภาษา, ระดับ
2. ตัด stop words(สวัสดี, ครับ, ค่ะ, มี, ไหม, อยาก, ให้, แนะนำ) ออก
3. ถ้ามีคำภาษาไทยและอังกฤษที่หมายถึงสิ่งเดียวกัน ให้ใส่ทั้งคู่
4. คืนค่าเป็น JSON array ของ keywords เท่านั้น

ตัวอย่าง:
คำถาม: "มีวิชาเกี่ยวกับการเขียนโปรแกรม Python ไหมครับ"
ตอบ: ["การเขียนโปรแกรม", "โปรแกรม", "programming", "Python", "ไพธอน"]

คำถาม: "แนะนำคอร์สภาษาอังกฤษระดับกลาง"
ตอบ: ["ภาษาอังกฤษ", "English", "ระดับกลาง", "intermediate"]

คืนค่าเฉพาะ JSON array: `;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: analysisPrompt }] }],
        generationConfig: {
          temperature: 0.3, // Low temperature for consistent keyword extraction
          maxOutputTokens: 200,
        }
      }),
    });

    if (!response.ok) {
      console.error('[Chatbot] Gemini keyword analysis failed, falling back to regex');
      return extractKeywordsWithRegex(userQuery);
    }

    const data = await response.json();
    const aiResult = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (aiResult) {
      // Extract JSON array from response
      const jsonMatch = aiResult.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const keywords = JSON.parse(jsonMatch[0]) as string[];
        console.log('[Chatbot] Gemini extracted keywords:', keywords);
        return keywords.filter(k => k.length >= 2); // Filter short words
      }
    }

    // Fallback to regex if parsing fails
    console.log('[Chatbot] Failed to parse Gemini response, falling back to regex');
    return extractKeywordsWithRegex(userQuery);

  } catch (error) {
    console.error('[Chatbot] Error in Gemini keyword analysis:', error);
    return extractKeywordsWithRegex(userQuery);
  }
}

/**
 * Fallback: Extract keywords using regex (old method)
 */
function extractKeywordsWithRegex(query: string): string[] {
  const englishKeywords = extractEnglishWords(query);
  const thaiKeywords = extractThaiKeywords(query);
  return [...englishKeywords, ...thaiKeywords];
}

/**
 * Extract English words from mixed Thai-English query
 */
function extractEnglishWords(query: string): string[] {
  // Match English words (letters and numbers)
  const englishWords = query.match(/[a-zA-Z]+/g) || [];
  return englishWords.filter(word => word.length > 2); // Only words with 3+ characters
}

/**
 * Extract key Thai phrases using pattern matching
 * Handles Thai text without word boundaries
 */
function extractThaiKeywords(query: string): string[] {
  // Remove English words first
  const withoutEnglish = query.replace(/[a-zA-Z]+/g, ' ');

  // Common Thai stop words to filter out
  const stopWords = [
    'สวัสดี', 'ครับ', 'ค่ะ', 'ขอบคุณ', 'ได้ใหม', 'หน่อย', 'อยาก', 'ให้',
    'แนะนำ', 'เกี่ยวกับ', 'วิชา', 'คอร์ส', 'รายวิชา', 'มี', 'ไหม', 'บ้าง',
    'อะไร', 'ของ', 'จาก', 'ใน', 'ที่', 'และ', 'หรือ', 'กับ', 'เพื่อ',
    'เป็น', 'มา', 'ไป', 'ได้', 'ถึง', 'จะ', 'ต้อง', 'สำหรับ', 'ผม', 'ฉัน',
    'คุณ', 'เขา', 'เธอ', 'พวก', 'นี้', 'นั้น', 'นั่น', 'นาย', 'น่า', 'ใหม'
  ];

  const keywords: string[] = [];

  // Find sequences of Thai characters
  const thaiText = withoutEnglish.match(/[\u0E00-\u0E7F]+/g) || [];

  for (const text of thaiText) {
    if (text.length < 4) continue; // Skip very short segments

    // Strategy: Extract meaningful patterns from long Thai text

    // Pattern 1: การ + following word (e.g., การเขียนโปรแกรม, การบริหารโครงการ)
    const pattern1Matches = text.matchAll(/การ[\u0E00-\u0E7F]{3,}?(?=[\u0E00-\u0E7F]{0,2}(?:ครับ|ค่ะ|ใหม|หน่อย|บ้าง|ไหม|$))|การ[\u0E00-\u0E7F]{4,}/g);
    for (const match of pattern1Matches) {
      const keyword = match[0];
      if (!stopWords.some(sw => keyword.includes(sw))) {
        keywords.push(keyword);
      }
    }

    // Pattern 2: ภาษา + language name (e.g., ภาษาอังกฤษ, ภาษาไทย, ภาษาจีน)
    const pattern2Matches = text.matchAll(/ภาษา[\u0E00-\u0E7F]{3,}?(?=[\u0E00-\u0E7F]{0,2}(?:ครับ|ค่ะ|ใหม|หน่อย|$))|ภาษา[\u0E00-\u0E7F]{3,}/g);
    for (const match of pattern2Matches) {
      keywords.push(match[0]);
    }

    // Pattern 3: โครงการ (project)
    if (text.includes('โครงการ')) {
      keywords.push('โครงการ');
    }

    // Pattern 4: โปรแกรม (program/programming)
    if (text.includes('โปรแกรม')) {
      keywords.push('โปรแกรม');
    }

    // Pattern 5: Remove stop words from remaining text and extract long words
    let remaining = text;
    for (const sw of stopWords) {
      remaining = remaining.replace(new RegExp(sw, 'g'), '|');
    }
    const parts = remaining.split('|').filter(p => p.length >= 6);
    keywords.push(...parts);
  }

  // Remove duplicates and filter out stop words
  const unique = [...new Set(keywords)].filter(k => !stopWords.includes(k) && k.length >= 4);
  return unique;
}

/**
 * Enhanced search across multiple tables
 * Uses Gemini AI for better keyword extraction
 */
async function searchKnowledgeBase(searchQuery: string): Promise<SearchResults> {
  try {
    // Use Gemini AI to extract keywords (with regex fallback)
    const allKeywords = await analyzeQueryWithGemini(searchQuery);

    // Use the first keyword for primary search (simplification)
    const keyword = allKeywords[0] || searchQuery;
    const searchPattern = `%${keyword}%`;

    console.log('[Chatbot DEBUG] searchQuery:', searchQuery);
    console.log('[Chatbot DEBUG] AI-extracted keywords:', allKeywords);

    // Search in parallel with error handling for each query
    const [guides, courses, news, institutions, instructors] = await Promise.all([
      // Search Guides - use all keywords (same as Courses)
      (async () => {
        if (allKeywords.length > 0) {
          const keywordConditions = allKeywords.map(() => '(title LIKE ? OR content LIKE ? OR keywords LIKE ?)').join(' OR ');
          const keywordParams = allKeywords.flatMap(keyword => [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]);

          return query<Guide>(
            `SELECT id, title, content, category, keywords FROM guides
             WHERE is_active = TRUE
             AND (${keywordConditions})
             ORDER BY
               CASE
                 WHEN title LIKE ? THEN 1
                 WHEN keywords LIKE ? THEN 2
                 ELSE 3
               END
             LIMIT 3`,
            [...keywordParams, `%${allKeywords[0]}%`, `%${allKeywords[0]}%`]
          ).catch(err => { console.error('[Chatbot] Guides query error:', err.message); return []; });
        } else {
          // Fallback to searchPattern if no keywords
          return query<Guide>(
            `SELECT id, title, content, category, keywords FROM guides
             WHERE is_active = TRUE
             AND (title LIKE ? OR content LIKE ? OR keywords LIKE ?)
             ORDER BY
               CASE
                 WHEN title LIKE ? THEN 1
                 WHEN keywords LIKE ? THEN 2
                 ELSE 3
               END
             LIMIT 3`,
            [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]
          ).catch(err => { console.error('[Chatbot] Guides query error:', err.message); return []; });
        }
      })(),

      // Search Courses - Enhanced with JOIN to institutions and instructors
      (async () => {
        if (allKeywords.length > 0) {
          // Build relevance score: count how many keywords match (including institution and instructor names)
          const titleMatches = allKeywords.map(() => 'CASE WHEN c.title LIKE ? THEN 1 ELSE 0 END').join(' + ');
          const descMatches = allKeywords.map(() => 'CASE WHEN c.description LIKE ? THEN 1 ELSE 0 END').join(' + ');
          const instMatches = allKeywords.map(() => 'CASE WHEN i.name LIKE ? OR i.nameEn LIKE ? THEN 1 ELSE 0 END').join(' + ');
          const instrMatches = allKeywords.map(() => 'CASE WHEN inst.name LIKE ? OR inst.nameEn LIKE ? THEN 1 ELSE 0 END').join(' + ');

          const keywordConditions = allKeywords.map(() => '(c.title LIKE ? OR c.description LIKE ? OR i.name LIKE ? OR i.nameEn LIKE ? OR inst.name LIKE ? OR inst.nameEn LIKE ?)').join(' OR ');
          const keywordParams = allKeywords.flatMap(keyword => [
            `%${keyword}%`, `%${keyword}%`, // course title, description
            `%${keyword}%`, `%${keyword}%`, // institution name, nameEn
            `%${keyword}%`, `%${keyword}%`  // instructor name, nameEn
          ]);
          const scoreParams = allKeywords.flatMap(keyword => [
            `%${keyword}%`, `%${keyword}%`, // title, desc
            `%${keyword}%`, `%${keyword}%`, // institution
            `%${keyword}%`, `%${keyword}%`  // instructor
          ]);

          return query<Course>(
            `SELECT DISTINCT c.id, c.title, c.description, c.level, c.institutionId,
              (${titleMatches}) * 3 + (${descMatches}) * 2 + (${instMatches}) + (${instrMatches}) as relevance_score
             FROM courses c
             LEFT JOIN institutions i ON c.institutionId = i.id
             LEFT JOIN course_instructors ci ON c.id = ci.courseId
             LEFT JOIN instructors inst ON ci.instructorId = inst.id
             WHERE ${keywordConditions}
             ORDER BY relevance_score DESC, c.title ASC
             LIMIT 5`,
            [...keywordParams, ...scoreParams]
          ).catch(err => { console.error('[Chatbot] Courses query error:', err.message); return []; });
        } else {
          // Fallback to original search with JOIN
          const sql = `SELECT DISTINCT c.id, c.title, c.description, c.level, c.institutionId
             FROM courses c
             LEFT JOIN institutions i ON c.institutionId = i.id
             LEFT JOIN course_instructors ci ON c.id = ci.courseId
             LEFT JOIN instructors inst ON ci.instructorId = inst.id
             WHERE c.title LIKE ? OR c.description LIKE ? OR i.name LIKE ? OR inst.name LIKE ?
             ORDER BY
               CASE
                 WHEN c.title LIKE ? THEN 1
                 WHEN i.name LIKE ? THEN 2
                 WHEN inst.name LIKE ? THEN 3
                 ELSE 4
               END,
               c.title ASC
             LIMIT 5`;
          const params = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern];
          console.log('[Chatbot DEBUG] Course Search Params:', params); // Debug log
          return query<Course>(sql, params).catch(err => { console.error('[Chatbot] Courses query error:', err.message); return []; });
        }
      })(),

      // Search News
      query<News>(
        `SELECT id, title, content, createdAt FROM news
         WHERE title LIKE ? OR content LIKE ?
         ORDER BY createdAt DESC
         LIMIT 3`,
        [searchPattern, searchPattern]
      ).catch(err => { console.error('[Chatbot] News query error:', err.message); return []; }),

      // Search Institutions
      query<Institution>(
        `SELECT id, name, nameEn, abbreviation, description, website FROM institutions
         WHERE name LIKE ? OR nameEn LIKE ? OR abbreviation LIKE ? OR description LIKE ?
         ORDER BY
           CASE
             WHEN abbreviation LIKE ? THEN 1
             WHEN name LIKE ? THEN 2
             WHEN nameEn LIKE ? THEN 3
             ELSE 4
           END
         LIMIT 2`,
        [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]
      ).then(res => {
        console.log('[Chatbot DEBUG] Institutions Search Params:', [searchPattern, searchPattern, searchPattern, searchPattern]);
        console.log('[Chatbot DEBUG] Institutions Found:', res.length);
        return res;
      }).catch(err => { console.error('[Chatbot] Institutions query error:', err.message); return []; }),

      // Search Instructors
      (async () => {
        const sql = `
          SELECT id, name, nameEn, bio FROM instructors
          WHERE name LIKE ? OR nameEn LIKE ? OR bio LIKE ?
          ORDER BY
            CASE
              WHEN name LIKE ? THEN 1
              WHEN nameEn LIKE ? THEN 2
              ELSE 3
            END
          LIMIT 3
        `;
        const params = [
          searchPattern, searchPattern, searchPattern,
          searchPattern, searchPattern
        ];
        return query<Instructor>(sql, params);
      })().catch(err => { console.error('[Chatbot] Instructors query error:', err.message); return []; }),
    ]);

    console.log(`[Chatbot] Searched "${searchQuery}" -> Guides: ${guides.length}, Courses: ${courses.length}, News: ${news.length}, Institutions: ${institutions.length}, Instructors: ${instructors.length} `);

    // Debug: Log actual courses found
    if (courses.length > 0) {
      console.log('[Chatbot] Courses found:', courses.map(c => ({ id: c.id, title: c.title })));
    } else {
      console.log('[Chatbot] No courses found for query:', searchQuery);
    }

    return { guides, courses, news, institutions, instructors };
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    console.error("Error details:", error instanceof Error ? error.message : error);
    console.error("Stack:", error instanceof Error ? error.stack : 'No stack');
    return { guides: [], courses: [], news: [], institutions: [], instructors: [] };
  }
}

/**
 * Get conversation history for AI memory
 */
async function getConversationHistory(conversationId: string, limit: number = 10): Promise<ChatMessage[]> {
  try {
    // Use template literal for LIMIT to avoid MySQL prepared statement issues
    const messages = await query<ChatMessage>(
      `SELECT sender_type, sender_name, message, created_at
       FROM chat_messages
       WHERE conversation_id = ?
       ORDER BY created_at DESC
       LIMIT ${parseInt(String(limit), 10)}`,
      [conversationId]
    );

    // Reverse to get chronological order (oldest first)
    return messages.reverse();
  } catch (error) {
    console.error("Error fetching conversation history:", error);
    return [];
  }
}

/**
 * Build context from search results
 */
function buildSearchContext(results: SearchResults): string {
  let contextText = "";

  // Add Guides context
  if (results.guides.length > 0) {
    contextText += "\n\n📚 ข้อมูลจากคู่มือการใช้งาน:\n";
    results.guides.forEach((guide, index) => {
      const cleanContent = guide.content.replace(/<[^>]*>/g, '').substring(0, 300);
      contextText += `${index + 1}. ${guide.title} \n   ${cleanContent}...\n\n`;
    });
  }

  // Add Courses context with course IDs for linking
  if (results.courses.length > 0) {
    contextText += "\n\n🎓 คอร์สเรียนที่เกี่ยวข้อง:\n";
    results.courses.forEach((course, index) => {
      const cleanDesc = course.description ? course.description.replace(/<[^>]*>/g, '').substring(0, 200) : '';
      contextText += `${index + 1}. ${course.title} \n   Course ID: ${course.id} \n   ระดับ: ${course.level} \n   ${cleanDesc}...\n\n`;
    });
  }

  // Add News context
  if (results.news.length > 0) {
    contextText += "\n\n📰 ข่าวประชาสัมพันธ์:\n";
    results.news.forEach((newsItem, index) => {
      const cleanContent = newsItem.content ? newsItem.content.replace(/<[^>]*>/g, '').substring(0, 200) : '';
      contextText += `${index + 1}. ${newsItem.title} \n   วันที่: ${newsItem.createdAt} \n   ${cleanContent}...\n\n`;
    });
  }

  // Add Institutions context
  if (results.institutions.length > 0) {
    contextText += "\n\n🏛️ สถาบันการศึกษา:\n";
    results.institutions.forEach((inst, index) => {
      const cleanDesc = inst.description ? inst.description.replace(/<[^>]*>/g, '').substring(0, 200) : '';
      contextText += `${index + 1}. ${inst.name} (${inst.abbreviation}) \n   English: ${inst.nameEn} \n   ${cleanDesc}...\n   เว็บไซต์: ${inst.website || 'ไม่ระบุ'} \n\n`;
    });
  }

  // Add Instructors context
  if (results.instructors.length > 0) {
    contextText += "\n\n👨‍🏫 ผู้สอน/วิทยากร:\n";
    results.instructors.forEach((instructor, index) => {
      const cleanBio = instructor.bio ? instructor.bio.replace(/<[^>]*>/g, '').substring(0, 200) : '';
      contextText += `${index + 1}. ${instructor.name} (${instructor.nameEn}) \n   ${cleanBio}...\n\n`;
    });
  }

  return contextText;
}

/**
 * Build conversation history context
 */
function buildHistoryContext(history: ChatMessage[]): string {
  if (history.length === 0) return "";

  let historyText = "\n\n💬 ประวัติการสนทนาก่อนหน้า:\n";
  history.forEach((msg) => {
    const speaker = msg.sender_type === 'user' ? 'ผู้ใช้' : 'ผู้ช่วย';
    historyText += `${speaker}: ${msg.message} \n`;
  });

  return historyText;
}

/**
 * Call Gemini AI API with enhanced context
 */
async function callGeminiAPI(
  userMessage: string,
  searchResults: SearchResults,
  conversationHistory: ChatMessage[]
): Promise<string> {
  const apiKey = await fetchGeminiApiKey();
  if (!apiKey) {
    return "ขออภัยครับ ระบบ AI ยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ";
  }

  try {
    // Build contexts
    const searchContext = buildSearchContext(searchResults);
    const historyContext = buildHistoryContext(conversationHistory);

    // Check if we have any data
    const hasData = searchResults.guides.length > 0 ||
      searchResults.courses.length > 0 ||
      searchResults.news.length > 0 ||
      searchResults.institutions.length > 0 ||
      searchResults.instructors.length > 0;

    // Build comprehensive prompt - Professional and friendly tone
    const prompt = `คุณคือผู้ช่วยดิจิทัลของ Thai MOOC Platform ซึ่งเป็นแพลตฟอร์มเรียนออนไลน์ภาษาไทยที่มีมาตรฐาน

บทบาทและความรับผิดชอบ:
คุณมีหน้าที่ให้บริการข้อมูลและคำแนะนำแก่ผู้ใช้งานใน 4 ด้านหลัก ได้แก่:
1. การใช้งานระบบและคู่มือต่างๆ(Guides)
2. การค้นหาและแนะนำรายวิชาออนไลน์(Courses)
3. ข่าวสารและประกาศที่เกี่ยวข้อง(News)
4. ข้อมูลสถาบันการศึกษาและพันธมิตร(Institutions)
5. ข้อมูลผู้สอนและวิทยากร(Instructors)

หลักการสำคัญในการให้บริการ:
• ตอบคำถามโดยอ้างอิงจากข้อมูลที่มีในระบบเท่านั้น ไม่สร้างหรือคาดเดาข้อมูล
• ใช้ภาษาที่สุภาพ เป็นมิตร และเข้าใจง่าย เหมาะสมกับผู้ใช้ทุกระดับ
• หากไม่มีข้อมูลที่แน่นอน ควรแจ้งให้ผู้ใช้ทราบอย่างชัดเจนและแนะนำช่องทางติดต่อที่เหมาะสม

แนวทางการตอบคำถามตามประเภท:

1. คำถามเกี่ยวกับการใช้งานระบบและคู่มือ(Guides):
- ค้นหาข้อมูลจากส่วน "ข้อมูลจากคู่มือการใช้งาน"
  - ให้คำแนะนำที่ชัดเจน เข้าใจง่าย พร้อมลิงก์อ้างอิง(หากมี)
    - ใช้ภาษาที่เป็นมิตรและสุภาพ

2. คำถามเกี่ยวกับรายวิชา(Courses):
ตัวอย่างคำถาม: "มีวิชาอะไรบ้าง", "อยากเรียน...", "แนะนำคอร์ส...", "สอนเรื่อง..."

วิธีการตอบ:
- ค้นหาข้อมูลจากส่วน "คอร์สเรียนที่เกี่ยวข้อง"
  - เริ่มต้นด้วยประโยคเปิด เช่น "ได้ค้นหารายวิชาที่เกี่ยวข้องให้แล้วค่ะ" หรือ "พบรายวิชาที่น่าสนใจดังนี้ค่ะ"
    - แสดงรายวิชาทั้งหมดที่พบ(สูงสุด 5 วิชา) เรียงตามความเกี่ยวข้อง

รูปแบบการแสดงผล(สำคัญมาก):
   • ใช้ bullet point(•) นำหน้าแต่ละวิชา
   • ชื่อวิชาต้องเป็น Markdown link รูปแบบ: [ชื่อวิชา](/courses/COURSE_ID)
   • ตามด้วยคำอธิบายสั้นๆ ของวิชา (1-2 ประโยค)
   • ถ้ามีข้อมูลระดับ (level) ให้ระบุด้วย เช่น "ระดับ: ปริญญาตรี"
   • ตัวอย่าง: • [Python Programming สำหรับผู้เริ่มต้น](/courses/course-001) - เรียนรู้การเขียนโปรแกรม Python ตั้งแต่พื้นฐาน เหมาะสำหรับผู้ที่ยังไม่มีประสบการณ์ (ระดับ: ปริญญาตรี)

📋 หลักการเรียบเรียงข้อมูลให้เข้าใจง่าย (สำคัญมาก):
1. **จัดกลุ่มข้อมูล**: ถ้ามีข้อมูลหลายประเภท (เช่น วิชา + สถาบัน) ให้แยกเป็นหมวดหมู่ชัดเจน
   - ใช้หัวข้อย่อย เช่น "📚 รายวิชาที่แนะนำ:", "🏛️ สถาบันที่เกี่ยวข้อง:"
   
2. **ใช้โครงสร้างที่ชัดเจน**:
   - เริ่มด้วยสรุปสั้นๆ (1 ประโยค)
   - ตามด้วยรายละเอียดแบบ bullet points
   - จบด้วยคำแนะนำเพิ่มเติม (ถ้ามี)

3. **ให้บริบท**: อธิบายสั้นๆ ว่าทำไมข้อมูลนี้เกี่ยวข้องกับคำถาม
   - ตัวอย่าง: "วิชาเหล่านี้มาจากมหาวิทยาลัยมหิดล ซึ่งเป็นสถาบันชั้นนำด้านวิทยาศาสตร์สุขภาพ"

4. **ใช้ภาษาที่เข้าใจง่าย**:
   - หลีกเลี่ยงศัพท์เทคนิคที่ซับซ้อน
   - ถ้าจำเป็นต้องใช้ ให้อธิบายความหมายสั้นๆ ในวงเล็บ

5. **เน้นข้อมูลสำคัญ**:
   - ระบุจุดเด่นของแต่ละวิชา/สถาบัน
   - ใช้คำเชื่อม เช่น "โดยเฉพาะ", "น่าสนใจคือ"

6. **จัดลำดับความสำคัญ**:
   - วิชาที่ตรงกับคำค้นหามากที่สุดควรอยู่ด้านบน
   - ถ้ามีหลายวิชาจากสถาบันเดียวกัน ให้กล่าวถึงสถาบันนั้นด้วย

ตัวอย่างการเรียบเรียงที่ดี:
"พบรายวิชาด้านการเงินจากมหาวิทยาลัยมหิดล 3 วิชาค่ะ:

📚 รายวิชาที่แนะนำ:
• [การพัฒนาโครงการอสังหาริมทรัพย์](/courses/course-324) - เรียนรู้การวิเคราะห์ความเป็นไปได้ทางการเงินในการลงทุนโครงการ เหมาะสำหรับผู้ที่สนใจธุรกิจอสังหาฯ (ระดับ: ปริญญาตรี)

• [เตรียมเกษียณเพื่อเสริมสร้างพฤฒพลัง](/courses/course-326) - ครอบคลุมการวางแผนทางการเงินเพื่อวัยเกษียณ พร้อมเทคนิคการจัดการสุขภาพและสังคม (ระดับ: ทั่วไป)

🏛️ สถาบันที่เกี่ยวข้อง:
มหาวิทยาลัยมหิดล (Mahidol University) เป็นสถาบันชั้นนำที่มีความเชี่ยวชาญด้านวิทยาศาสตร์สุขภาพและสังคมศาสตร์"

ข้อควรระวัง:
- ใช้เฉพาะข้อมูลจาก Course ID และชื่อวิชาที่ระบุในข้อมูลเท่านั้น
  - ห้ามแต่งชื่อวิชาหรือรายละเอียดที่ไม่มีในข้อมูล
  - ลิงก์จะถูกแปลงให้คลิกได้ ไม่ต้องแสดง URL ในข้อความ
    - ไม่ใช้คำทักทาย "สวัสดีครับ" เมื่อมีรายวิชาให้แนะนำ ให้เข้าเรื่องทันที

3. คำถามเกี่ยวกับข่าวสารและประกาศ(News):
- ค้นหาจากส่วน "ข่าวประชาสัมพันธ์"
  - สรุปข่าวที่เกี่ยวข้องอย่างกระชับและชัดเจน
  - ให้ข้อมูลที่เป็นปัจจุบันและตรงประเด็น

4. คำถามเกี่ยวกับสถาบันการศึกษา(Institutions):
- ค้นหาจากส่วน "สถาบันการศึกษา"
  - แสดงชื่อเต็ม พร้อมชื่อย่อในวงเล็บ เช่น "มหาวิทยาลัยมหิดล (Mahidol University)"
  - ระบุชื่อย่อ (abbreviation) ถ้ามี เช่น "KMUTT"
  - แนะนำสถาบันพร้อมข้อมูลสำคัญและลิงก์เว็บไซต์ (หากมี)
  - อธิบายเกี่ยวกับคุณสมบัติหรือจุดเด่นของสถาบัน
  - ถ้ามีรายวิชาจากสถาบันนั้น ให้กล่าวถึงและแสดงรายวิชาด้วย

รูปแบบการแสดงผล:
"🏛️ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (KMUTT)
King Mongkut's University of Technology Thonburi

เป็นสถาบันชั้นนำด้านวิศวกรรมศาสตร์และเทคโนโลยี...
เว็บไซต์: https://kmutt.ac.th

📚 รายวิชาจาก KMUTT:
• [วิชา 1](/courses/xxx) - ...
• [วิชา 2](/courses/yyy) - ..."

5. คำถามเกี่ยวกับผู้สอน / วิทยากร(Instructors):
- ค้นหาจากส่วน "ผู้สอน/วิทยากร"
  - แสดงชื่อภาษาไทยและอังกฤษ
  - แนะนำผู้สอนพร้อมข้อมูลความเชี่ยวชาญและประสบการณ์
  - หากผู้ใช้ถามหาวิชาของผู้สอนคนใดคนหนึ่ง ให้ดูจากส่วน "คอร์สเรียนที่เกี่ยวข้อง" ที่ระบบค้นหาให้แล้ว
  - จัดกลุ่มข้อมูลให้ชัดเจน: ข้อมูลผู้สอน → รายวิชาที่สอน

6. กรณีไม่พบข้อมูลในระบบ(สำคัญมาก):
เมื่อผู้ใช้ถามเกี่ยวกับปัญหา / คำแนะนำ แต่ไม่พบข้อมูลในระบบ:
- แจ้งอย่างสุภาพว่า "ขออภัยค่ะ ปัญหาที่คุณสอบถามเกินกว่าที่ฉันจะให้คำแนะนำได้ในขณะนี้"
  - บอกว่า "แนะนำให้ติดต่อศูนย์ช่วยเหลือเพื่อรับการช่วยเหลือจากเจ้าหน้าที่โดยตรงค่ะ"
    - ** สำคัญ:** ต้องลงท้ายด้วย marker พิเศษ[SUPPORT_REDIRECT] เพื่อให้ระบบแสดงปุ่มนำทางไปหน้าช่วยเหลือ
      - ตัวอย่าง: "ขออภัยค่ะ ปัญหาที่คุณสอบถามเกินกว่าที่ฉันจะให้คำแนะนำได้ในขณะนี้ แนะนำให้ติดต่อศูนย์ช่วยเหลือเพื่อรับการช่วยเหลือจากเจ้าหน้าที่โดยตรงค่ะ [SUPPORT_REDIRECT]"

7. กรณีคำทักทาย(สวัสดี, หวัดดี, ดีจ้า):
- ตอบรับอย่างสุภาพและเป็นมิตร
  - สอบถามว่าต้องการความช่วยเหลือด้านใด
  - ** ห้ามใส่[SUPPORT_REDIRECT] ** เพราะเป็นแค่การทักทาย

${historyContext}
${searchContext}

${hasData ?
        `สถานะ: พบข้อมูลที่เกี่ยวข้องในระบบ
หมายเหตุ: กรุณาใช้เฉพาะข้อมูลที่ปรากฏด้านบนเท่านั้น ห้ามเพิ่มเติมหรือสมมติข้อมูลที่ไม่มี` :
        `สถานะ: ไม่พบข้อมูลที่เกี่ยวข้องในระบบ
หมายเหตุ: แจ้งผู้ใช้อย่างสุภาพว่าไม่พบข้อมูล และแนะนำให้ติดต่อ support@thaimooc.ac.th`}

คำถามจากผู้ใช้: ${userMessage}

⚠️ สำคัญ: กรุณาเรียบเรียงข้อมูลให้เข้าใจง่าย มีโครงสร้างชัดเจน ใช้หัวข้อย่อยและ bullet points ตามหลักการที่ระบุด้านบน

กรุณาตอบคำถามด้วยภาษาที่สุภาพ เป็นมิตร และเข้าใจง่าย โดยอ้างอิงจากข้อมูลข้างต้น: `;

    const response = await fetch(`${GEMINI_API_URL}?key=${await fetchGeminiApiKey()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1000,
          topP: 0.9,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error:", errorData);
      return "ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง";
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    }

    return "ขอโทษครับ ไม่สามารถสร้างคำตอบได้ กรุณาลองใหม่อีกครั้ง";

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อ AI กรุณาลองใหม่อีกครั้ง";
  }
}

/**
 * POST /api/chatbot - Send message to chatbot
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChatbotRequest = await request.json();
    const { message, conversationId, userName, userEmail } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    let currentConversationId = conversationId;

    // Step 1: Create or get conversation
    if (!currentConversationId) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      currentConversationId = `conv-${timestamp}-${random}`;

      await execute(
        `INSERT INTO chat_conversations
  (id, user_id, user_name, user_email, status, priority, category, last_message_at, created_at, updated_at)
VALUES(?, NULL, ?, ?, 'active', 'normal', 'general', NOW(), NOW(), NOW())`,
        [currentConversationId, userName || "Guest", userEmail || null]
      );
    }

    // Step 2: Get conversation history for AI memory
    const conversationHistory = await getConversationHistory(currentConversationId, 10);
    console.log(`[Chatbot] Retrieved ${conversationHistory.length} previous messages for context`);

    // Step 3: Save user message
    const userMsgTimestamp = Date.now();
    const userMsgRandom = Math.random().toString(36).substring(7);
    const userMessageId = `msg-${userMsgTimestamp}-${userMsgRandom}`;

    await execute(
      `INSERT INTO chat_messages
  (id, conversation_id, sender_type, sender_id, sender_name, message, is_read, created_at)
VALUES(?, ?, 'user', NULL, ?, ?, FALSE, NOW())`,
      [userMessageId, currentConversationId, userName || "Guest", message]
    );

    // Step 4: Search across all knowledge bases
    const searchResults = await searchKnowledgeBase(message);
    const totalResults = searchResults.guides.length +
      searchResults.courses.length +
      searchResults.news.length +
      searchResults.institutions.length +
      searchResults.instructors.length;

    console.log(`[Chatbot] Found ${totalResults} total results across all sources`);

    // Step 5: Get AI response with full context
    let aiResponse = await callGeminiAPI(message, searchResults, conversationHistory);

    // Step 5.5: Parse special markers and create action buttons
    let actions: ActionButton[] | undefined;

    // Check for SUPPORT_REDIRECT marker
    if (aiResponse.includes('[SUPPORT_REDIRECT]')) {
      // Remove the marker from the message
      aiResponse = aiResponse.replace(/\[SUPPORT_REDIRECT\]/g, '').trim();

      // Add action buttons
      actions = [
        {
          type: "support_redirect",
          label: "ไปยังศูนย์ช่วยเหลือ",
          url: "/support",
          variant: "primary"
        },
        {
          type: "ask_another",
          label: "ถามคำถามอื่น",
          variant: "secondary"
        }
      ];

      console.log('[Chatbot] Support redirect marker detected, adding action buttons');
    }

    // Step 6: Save AI message with metadata
    const aiMsgTimestamp = Date.now();
    const aiMsgRandom = Math.random().toString(36).substring(7);
    const aiMessageId = `msg-${aiMsgTimestamp}-${aiMsgRandom}`;

    const metadata = {
      guidesUsed: searchResults.guides.map(g => g.id),
      coursesFound: searchResults.courses.map(c => c.id),
      newsFound: searchResults.news.map(n => n.id),
      institutionsFound: searchResults.institutions.map(i => i.id),
      instructorsFound: searchResults.instructors.map(i => i.id),
      totalResults,
    };

    await execute(
      `INSERT INTO chat_messages
  (id, conversation_id, sender_type, sender_id, sender_name, message, metadata, is_read, created_at)
VALUES(?, ?, 'ai', 'gemini', 'Thai MOOC Assistant', ?, ?, TRUE, NOW())`,
      [
        aiMessageId,
        currentConversationId,
        aiResponse,
        JSON.stringify(metadata)
      ]
    );

    // Step 7: Update conversation timestamp
    await execute(
      "UPDATE chat_conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = ?",
      [currentConversationId]
    );

    // Return comprehensive response
    return NextResponse.json({
      success: true,
      data: {
        conversationId: currentConversationId,
        userMessage: {
          id: userMessageId,
          message,
          timestamp: new Date().toISOString(),
        },
        aiMessage: {
          id: aiMessageId,
          message: aiResponse,
          timestamp: new Date().toISOString(),
          actions,
        },
        context: {
          guidesUsed: searchResults.guides.length,
          coursesFound: searchResults.courses.length,
          newsFound: searchResults.news.length,
          institutionsFound: searchResults.institutions.length,
          instructorsFound: searchResults.instructors.length,
          historyMessages: conversationHistory.length,
          totalResults,
        },
      },
    });

  } catch (error) {
    console.error("Chatbot API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
