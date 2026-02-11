import { query } from "../lib/mysql-direct";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const TABLES = [
    "webapp_settings",
    "admin_users", // Corrected
    "institutions",
    "instructors",
    "categories",
    "course_types",
    "courses",
    "course_categories",
    "course_course_types",
    "course_instructors", // Added
    "news",
    "banners",
    "guides",
    "image_placeholders",
    "menus", // Added
    "menu_items", // Added
    "tickets", // Added
    "ticket_replies", // Added
    "popups", // Added
];

async function extractSeedData() {
    console.log("Starting seed data extraction...");
    const seedData: Record<string, any[]> = {};

    try {
        for (const table of TABLES) {
            console.log(`Extracting ${table}...`);
            try {
                const rows = await query(`SELECT * FROM ${table}`);
                seedData[table] = rows;
            } catch (e) {
                console.warn(`Skipping ${table}: ${(e as Error).message}`);
            }
        }

        const outputPath = path.join(process.cwd(), "scripts", "seed-data.json");
        fs.writeFileSync(outputPath, JSON.stringify(seedData, null, 2));

        console.log(`✅ Seed data extracted to: ${outputPath}`);

        // Also create a restore script hint
        console.log("\nTo restore this data, you would need a script that iterates over these keys and INSERTs them.");

    } catch (error) {
        console.error("Extraction failed:", error);
        process.exit(1);
    }
}

extractSeedData();
