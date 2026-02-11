/**
 * Direct MySQL Connection (ไม่ผ่าน Prisma)
 * ใช้สำหรับ query ที่ซับซ้อนหรือต้องการ performance สูง
 */

import mysql from 'mysql2/promise';

// Helper to parse connection string
function parseDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 3306,
      user: parsed.username,
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.slice(1), // remove leading /
    };
  } catch (e) {
    return {};
  }
}

const dbUrlConfig = process.env.DATABASE_URL ? parseDatabaseUrl(process.env.DATABASE_URL) : {};

// Configuration - Optimized for 1000 concurrent users
const dbConfig = {
  host: process.env.DB_HOST || dbUrlConfig.host || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '') || dbUrlConfig.port || 3306,
  user: process.env.DB_USER || dbUrlConfig.user || 'root',
  password: process.env.DB_PASSWORD || dbUrlConfig.password || 'KKiabkob',
  database: process.env.DB_NAME || dbUrlConfig.database || 'web_muic',
  charset: 'utf8mb4', // FIX: Support Thai and emoji characters
  waitForConnections: true,
  connectionLimit: 100, // เพิ่มจาก 20 เป็น 100 สำหรับ 1000 concurrent users
  maxIdle: 20, // จำนวน idle connections สูงสุด (เพิ่มจาก 10)
  idleTimeout: 60000, // 60 วินาที - ปิด connection ที่ idle
  queueLimit: 0, // ไม่จำกัด queue (จะ wait ถ้า connections เต็ม)
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000, // 10 วินาที
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Type for SQL parameters
export type SqlParam = string | number | boolean | null | undefined | Date;
export type SqlParams = SqlParam[];

/**
 * Execute raw SQL query
 */
export async function query<T = any>(
  sql: string,
  params?: SqlParams
): Promise<T[]> {
  try {
    // Check if running in build context or if DATABASE_URL is missing
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.IS_BUILD === 'true' || !process.env.DATABASE_URL) {
      console.log('Skipping DB query (Build mode or No DB URL)');
      return [] as T[];
    }
    const [rows] = await pool.execute(sql, params);
    return rows as T[];
  } catch (error) {
    console.error('MySQL Query Error:', error);
    // During build, just return empty instead of failing
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.IS_BUILD === 'true') {
      return [] as T[];
    }
    throw error;
  }
}

/**
 * Execute query and return first row
 */
export async function queryOne<T = any>(
  sql: string,
  params?: SqlParams
): Promise<T | null> {
  try {
    // Check if running in build context or if DATABASE_URL is missing
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.IS_BUILD === 'true' || !process.env.DATABASE_URL) {
      return null;
    }
    const [rows] = await pool.execute(sql, params);
    const result = rows as T[];
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('MySQL Query Error:', error);
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.IS_BUILD === 'true') {
      return null;
    }
    throw error;
  }
}

/**
 * Execute insert/update/delete query
 */
export async function execute(
  sql: string,
  params?: SqlParams
): Promise<mysql.ResultSetHeader> {
  try {
    // Check if running in build context or if DATABASE_URL is missing
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.IS_BUILD === 'true' || !process.env.DATABASE_URL) {
      return { affectedRows: 0 } as mysql.ResultSetHeader;
    }
    const [result] = await pool.execute(sql, params);
    return result as mysql.ResultSetHeader;
  } catch (error) {
    console.error('MySQL Execute Error:', error);
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.IS_BUILD === 'true') {
      return { affectedRows: 0 } as mysql.ResultSetHeader;
    }
    throw error;
  }
}

/**
 * Transaction helper
 */
export async function transaction<T>(
  callback: (execute: (sql: string, params?: SqlParams) => Promise<mysql.ResultSetHeader>) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Create execute function for this transaction
    const executeInTransaction = async (sql: string, params?: SqlParams): Promise<mysql.ResultSetHeader> => {
      const [result] = await connection.execute(sql, params);
      return result as mysql.ResultSetHeader;
    };

    const result = await callback(executeInTransaction);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get connection from pool (for complex operations)
 */
export async function getConnection(): Promise<mysql.PoolConnection> {
  return await pool.getConnection();
}

/**
 * Close pool (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

// Export pool for advanced usage
export { pool };

export default {
  query,
  queryOne,
  execute,
  transaction,
  getConnection,
  closePool,
  pool,
};
