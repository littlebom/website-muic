// Gemini AI Integration using REST API directly
// No SDK dependency - works with gemini-1.5-flash and gemini-1.5-pro

// Hard Skill Domains (6 axes)
export const HARD_SKILL_DOMAINS = {
  H1: "Data Science & AI Fluency",
  H2: "Digital Development & Security",
  H3: "Technical Project & Process Mgmt",
  H4: "Financial & Strategic Modeling",
  H5: "Specialized Technical Operations",
  H6: "Regulatory & Compliance Skills",
};

// Soft Skill Domains (6 axes)
export const SOFT_SKILL_DOMAINS = {
  S1: "Analytical & Critical Thinking",
  S2: "Communication & Collaboration",
  S3: "Leadership & Social Influence",
  S4: "Adaptability & Resilience",
  S5: "Creativity & Initiative",
  S6: "Customer & Service Orientation",
};

export interface CourseData {
  id: string;
  titleTh: string;
  titleEn?: string;
  description?: string;
  learningOutcomes?: string;
  categories?: string[];
  level?: string;
  targetAudience?: string;
  prerequisites?: string;
  tags?: string[];
  contentStructure?: string;
}

export interface SkillScores {
  H1: number;
  H2: number;
  H3: number;
  H4: number;
  H5: number;
  H6: number;
}

export interface SoftSkillScores {
  S1: number;
  S2: number;
  S3: number;
  S4: number;
  S5: number;
  S6: number;
}

export interface SkillAnalysis {
  hardSkills: SkillScores;
  softSkills: SoftSkillScores;
  reasoningTh: string; // Reasoning in Thai
  reasoningEn: string; // Reasoning in English
  reasoning?: string; // Legacy support
}

import { getSettings } from "@/lib/data";

/**
 * Call Gemini API directly using REST API
 */
async function callGeminiAPI(prompt: string, apiKey: string): Promise<string> {
  const MODEL = "gemini-2.0-flash"; // Updated to latest available model
  const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent`;

  console.log("[DEBUG] Calling Gemini REST API:", API_ENDPOINT);

  const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[DEBUG] Gemini API Error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log("[DEBUG] Gemini API response received successfully");

  // Extract text from response
  if (
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts &&
    data.candidates[0].content.parts[0]
  ) {
    return data.candidates[0].content.parts[0].text;
  }

  throw new Error("Invalid response structure from Gemini API");
}

/**
 * Analyze course content using Gemini AI to extract skill insights
 */
export async function analyzeCourseSkills(
  courseData: CourseData
): Promise<SkillAnalysis> {
  // Check if API key is configured
  const settings = await getSettings().catch(() => ({ geminiApiKey: null }));
  const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;

  console.log(
    "[DEBUG] GEMINI_API_KEY:",
    apiKey
      ? "SET (" + apiKey.substring(0, 10) + "...)"
      : "NOT SET"
  );

  if (
    !apiKey ||
    apiKey === "your_gemini_api_key_here"
  ) {
    console.warn("Gemini API key not configured. Returning mock data.");
    return getMockSkillAnalysis();
  }

  try {
    // Build comprehensive prompt in Thai for better analysis
    const prompt = `
คุณเป็นผู้เชี่ยวชาญด้านการวิเคราะห์หลักสูตรและทักษะ วิเคราะห์รายวิชาต่อไปนี้และให้คะแนนทักษะในแต่ละด้าน (0-100):

**ข้อมูลรายวิชา:**
- ชื่อ (ไทย): ${courseData.titleTh}
- ชื่อ (อังกฤษ): ${courseData.titleEn || "ไม่ระบุ"}
- คำอธิบาย: ${courseData.description || "ไม่ระบุ"}
- ผลการเรียนรู้: ${courseData.learningOutcomes || "ไม่ระบุ"}
- หมวดหมู่: ${courseData.categories?.join(", ") || "ไม่ระบุ"}
- ระดับ: ${courseData.level || "ไม่ระบุ"}
- กลุ่มเป้าหมาย: ${courseData.targetAudience || "ไม่ระบุ"}
- ความรู้พื้นฐาน: ${courseData.prerequisites || "ไม่ระบุ"}
- แท็ก: ${courseData.tags?.join(", ") || "ไม่ระบุ"}
- โครงสร้างเนื้อหา: ${courseData.contentStructure || "ไม่ระบุ"}

**Hard Skills ที่ต้องวิเคราะห์ (ให้คะแนน 0-100):**
1. H1: Data Science & AI Fluency - ความเชี่ยวชาญด้านวิทยาการข้อมูลและ AI
2. H2: Digital Development & Security - การพัฒนาดิจิทัลและความปลอดภัย
3. H3: Technical Project & Process Mgmt - การจัดการโครงการและกระบวนการทางเทคนิค
4. H4: Financial & Strategic Modeling - การสร้างแบบจำลองทางการเงินและกลยุทธ์
5. H5: Specialized Technical Operations - การดำเนินงานทางเทคนิคเฉพาะทาง
6. H6: Regulatory & Compliance Skills - ทักษะด้านกฎระเบียบและการปฏิบัติตามข้อกำหนด

**Soft Skills ที่ต้องวิเคราะห์ (ให้คะแนน 0-100):**
1. S1: Analytical & Critical Thinking - การคิดวิเคราะห์และคิดเชิงวิพากษ์
2. S2: Communication & Collaboration - การสื่อสารและทำงานร่วมกัน
3. S3: Leadership & Social Influence - ภาวะผู้นำและอิทธิพลทางสังคม
4. S4: Adaptability & Resilience - ความสามารถในการปรับตัวและความยืดหยุ่น
5. S5: Creativity & Initiative - ความคิดสร้างสรรค์และความคิดริเริ่ม
6. S6: Customer & Service Orientation - การมุ่งเน้นลูกค้าและการบริการ

**คำแนะนำการให้คะแนน:**
- 0-30: ไม่เกี่ยวข้อง หรือเกี่ยวข้องน้อยมาก
- 31-50: เกี่ยวข้องบางส่วน หรือเป็นพื้นฐาน
- 51-70: เกี่ยวข้องปานกลาง มีการพัฒนาทักษะนี้อย่างชัดเจน
- 71-85: เกี่ยวข้องสูง เป็นทักษะหลักของคอร์ส
- 86-100: เกี่ยวข้องสูงมาก เป็นจุดเน้นหลักของคอร์ส

**กรุณาตอบกลับในรูปแบบ JSON เท่านั้น:**
{
  "hardSkills": {
    "H1": <คะแนน 0-100>,
    "H2": <คะแนน 0-100>,
    "H3": <คะแนน 0-100>,
    "H4": <คะแนน 0-100>,
    "H5": <คะแนน 0-100>,
    "H6": <คะแนน 0-100>
  },
  "softSkills": {
    "S1": <คะแนน 0-100>,
    "S2": <คะแนน 0-100>,
    "S3": <คะแนน 0-100>,
    "S4": <คะแนน 0-100>,
    "S5": <คะแนน 0-100>,
    "S6": <คะแนน 0-100>
  },
  "reasoningTh": "<คำอธิบายสั้นๆ ว่าทำไมให้คะแนนแบบนี้ (2-3 ประโยคภาษาไทย)>",
  "reasoningEn": "<Short explanation of why these scores were given (2-3 sentences in English)>"
}
`;

    console.log("[DEBUG] Sending prompt to Gemini API...");
    // ... rest of the logic ...

    const text = await callGeminiAPI(prompt, apiKey);
    console.log("[DEBUG] Response received:", text.substring(0, 200) + "...");

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[DEBUG] Failed to parse JSON from response:", text);
      return getMockSkillAnalysis();
    }

    const analysis: SkillAnalysis = JSON.parse(jsonMatch[0]);

    // Validate scores are within 0-100
    const validateScores = (scores: any): boolean => {
      return Object.values(scores).every(
        (score) => typeof score === "number" && score >= 0 && score <= 100
      );
    };

    if (
      !analysis.hardSkills ||
      !analysis.softSkills ||
      !validateScores(analysis.hardSkills) ||
      !validateScores(analysis.softSkills)
    ) {
      console.error("[DEBUG] Invalid skill scores from Gemini:", analysis);
      return getMockSkillAnalysis();
    }

    console.log("[DEBUG] Successfully parsed and validated Gemini response");
    return analysis;
  } catch (error) {
    console.error("[ERROR] Error analyzing course with Gemini:", error);
    return getMockSkillAnalysis();
  }
}

/**
 * Mock data for testing or when API is unavailable
 */
function getMockSkillAnalysis(): SkillAnalysis {
  return {
    hardSkills: {
      H1: 75,
      H2: 60,
      H3: 45,
      H4: 30,
      H5: 50,
      H6: 25,
    },
    softSkills: {
      S1: 80,
      S2: 70,
      S3: 55,
      S4: 65,
      S5: 60,
      S6: 50,
    },
    reasoningTh:
      "นี่คือข้อมูลตัวอย่างเนื่องจาก Gemini API ยังไม่ได้รับการกำหนดค่า โปรดเพิ่ม GEMINI_API_KEY ใน .env เพื่อใช้งานจริง",
    reasoningEn:
      "This is mock data because Gemini API is not configured. Please add GEMINI_API_KEY to .env for production use.",
    reasoning: "Mock data / ข้อมูลตัวอย่าง",
  };
}
