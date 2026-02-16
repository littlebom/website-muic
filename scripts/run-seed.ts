import { query, execute } from "../lib/mysql-direct";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

async function runSeed() {
    console.log("🚀 Starting database seeding...");

    const seedDataPath = path.join(process.cwd(), "scripts", "seed-data.json");
    if (!fs.existsSync(seedDataPath)) {
        console.error("❌ Seed data file not found at:", seedDataPath);
        process.exit(1);
    }

    const seedData = JSON.parse(fs.readFileSync(seedDataPath, "utf8"));
    const tables = Object.keys(seedData);

    try {
        // Disable foreign key checks for clean truncation and insertion
        await execute("SET FOREIGN_KEY_CHECKS = 0");
        console.log("🔓 Disabled foreign key checks.");

        for (const table of tables) {
            const rows = seedData[table];
            if (!rows || rows.length === 0) {
                console.log(`- Skipping ${table} (no data)`);
                continue;
            }

            console.log(`- Seeding ${table} (${rows.length} rows)...`);

            // 1. Clear existing data
            await execute(`TRUNCATE TABLE ${table}`);

            // 2. Prepare bulk insert
            const columns = Object.keys(rows[0]);
            const placeholders = columns.map(() => "?").join(", ");
            const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;

            for (const row of rows) {
                const values = columns.map(col => {
                    const val = row[col];
                    // Handle special cases like Dates if they were stringified
                    if (val && typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
                        return new Date(val);
                    }
                    return val;
                });
                await execute(sql, values);
            }
        }

        // Re-enable foreign key checks
        await execute("SET FOREIGN_KEY_CHECKS = 1");
        console.log("🔒 Re-enabled foreign key checks.");

        console.log("✅ Seeding completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        // Ensure foreign key checks are re-enabled even on failure
        await execute("SET FOREIGN_KEY_CHECKS = 1");
        process.exit(1);
    }
}

runSeed();
