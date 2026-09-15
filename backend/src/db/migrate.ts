import fs from 'fs';
import path from 'path';
import { pool } from './client';

export async function runMigrations(): Promise<void> {
  const possiblePaths = [
    path.join(__dirname, 'schema.sql'),
    path.join(process.cwd(), 'src', 'db', 'schema.sql'),
    path.join(process.cwd(), 'dist', 'db', 'schema.sql'),
    path.join(process.cwd(), 'backend', 'src', 'db', 'schema.sql'),
    path.join(__dirname, '..', '..', 'src', 'db', 'schema.sql'),
  ];
  const schemaPath = possiblePaths.find((p) => fs.existsSync(p));
  if (!schemaPath) {
    throw new Error('schema.sql could not be found');
  }
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log(`🔄 Running database schema migration from ${schemaPath}...`);
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
