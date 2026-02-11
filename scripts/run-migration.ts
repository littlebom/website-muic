import { execute } from '../lib/mysql-direct';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, '../migrations/02_improve_banners.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon to handle multiple statements
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`Found ${statements.length} statements to execute.`);

        for (const sql of statements) {
            console.log(`Executing: ${sql}`);
            await execute(sql);
        }

        console.log('Banner migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
