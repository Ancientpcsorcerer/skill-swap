import { app } from './app';
import { env } from './config/env';
import { connectDb, pool } from './db/client';
import { runMigrations } from './db/migrate';

async function startServer() {
  console.log(`🚀 Starting Skill Swap API server in ${env.NODE_ENV} mode...`);

  try {
    // Attempt database connectivity and run schema migrations
    await connectDb();
    await runMigrations().catch((mErr) => {
      console.warn('⚠️  Schema synchronization note:', mErr.message);
    });
  } catch (err) {
    console.warn('⚠️  Database connection could not be established on startup:', err);
    console.warn('⚠️  Server will start, but database-dependent routes may fail until DB is accessible.');
  }

  const server = app.listen(env.PORT, () => {
    console.log(`✅ Skill Swap API listening at http://localhost:${env.PORT}`);
    console.log(`✅ Health check: http://localhost:${env.PORT}/health`);
    console.log(`✅ API base: http://localhost:${env.PORT}/api/v1`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, initiating graceful shutdown...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      await pool.end();
      console.log('PostgreSQL pool drained.');
      process.exit(0);
    });

    // Force close after 10s if graceful shutdown hangs
    setTimeout(() => {
      console.error('Forced shutdown timeout exceeded. Exiting immediately.');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Fatal error during server startup:', err);
  process.exit(1);
});
