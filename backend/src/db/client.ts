import { Pool, PoolClient, QueryResultRow } from 'pg';
import { env } from '../config/env';

const isRemoteOrProd =
  env.NODE_ENV === 'production' ||
  env.DATABASE_URL.includes('sslmode=require') ||
  env.DATABASE_URL.includes('timescale.com') ||
  env.DATABASE_URL.includes('render.com');

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: isRemoteOrProd ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err);
});

/** Verify database connectivity on startup */
export async function connectDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('✅  PostgreSQL connected');
  } finally {
    client.release();
  }
}

/** Run a query and return rows */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

/** Run a query and return first row or null */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await pool.query<T>(text, params);
  return result.rows[0] ?? null;
}

/** Run queries inside a transaction */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
