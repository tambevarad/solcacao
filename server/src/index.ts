import 'dotenv/config';
import { app } from './app.js';
import { ensureAuthIndexes } from './features/auth/service.js';
import { connectDb, disconnectDb } from './shared/db.js';
import { ConfigError, loadServerEnv } from './shared/env.js';

/**
 * Validate configuration, connect to MongoDB, then listen. Any failure exits with a clear message
 * (never the secret or the full URI) instead of serving requests without a database.
 */
async function start() {
  const env = loadServerEnv();
  try {
    await connectDb(env.mongoUri);
    await ensureAuthIndexes();
  } catch (error) {
    throw new Error(
      `Could not connect to MongoDB (${error instanceof Error ? error.name : 'unknown error'}). ` +
        'Start it with `npm run services` or check MONGODB_URI.',
    );
  }
  const server = app.listen(env.port, () => console.log(`SolCacao API listening on :${env.port}`));
  const stop = () => server.close(() => void disconnectDb().finally(() => process.exit(0)));
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

start().catch((error: unknown) => {
  console.error(
    error instanceof ConfigError || error instanceof Error ? error.message : 'Startup failed',
  );
  process.exit(1);
});
