import { query } from "@/lib/data";
import { SupportContent } from "@/components/support/support-content";

// export const dynamic = 'force-dynamic'; // Removed

// Fetch guides from database
async function getGuides() {
  try {
    const guides = await query(
      `SELECT id, title, category, view_count, created_at, updated_at
       FROM guides
       WHERE is_active = TRUE
       ORDER BY category, title ASC`
    );
    return guides;
  } catch (error) {
    console.error("Error fetching guides:", error);
    return [];
  }
}

// Get unique categories
function getCategories(guides: any[]) {
  const categories = [...new Set(guides.map((g) => g.category || "ทั่วไป"))];
  return categories.sort();
}

export default async function SupportPage() {
  const guides = await getGuides();
  const categories = getCategories(guides);

  return <SupportContent guides={guides} categories={categories} />;
}
