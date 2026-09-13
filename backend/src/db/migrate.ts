import fs from 'fs';
import path from 'path';
import { pool } from './client';

export async function runMigrations(): Promise<void> {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('🔄 Running database schema migration...');
  const client = await pool.connect();
  try {
    await client.query(schemaSql);
    console.log('✅ Database schema migrated successfully.');
  } catch (err) {
    console.error('❌ Database migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Allow running directly via tsx: `tsx src/db/migrate.ts`
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
