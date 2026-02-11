import { query } from '@/lib/mysql-direct';

async function checkSchema() {
    try {
        const result = await query('DESCRIBE courses');
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Failed to describe table:', error);
        process.exit(1);
    }
}

checkSchema();
