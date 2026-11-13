import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './features/auth/router.js';
import { shellRouter } from './features/shell/router.js';
import { catalogRouter } from './features/catalog/router.js';
import { b2bRouter } from './features/b2b/router.js';
import { supportRouter } from './features/support/router.js';
import { createClientRouter } from './features/shell/client.js';
import { isDatabaseReady } from './shared/db.js';
import { errorHandler, notFoundHandler } from './shared/errors.js';
export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    exposedHeaders: ['X-Page', 'X-Limit', 'X-Total-Count', 'X-Total-Pages'],
  }),
);
app.use(express.json({ limit: '100kb' }));
// Readiness reflects the real connection: 503 until connectDb has succeeded (and after a loss).
app.get('/api/health', (_req, res) => {
  const ready = isDatabaseReady();
  res
    .status(ready ? 200 : 503)
    .set('Cache-Control', 'no-store')
    .json({
      data: {
        status: ready ? 'ok' : 'unavailable',
        database: ready ? 'connected' : 'disconnected',
      },
    });
});
app.use('/api', authRouter);
app.use('/api', shellRouter);
app.use('/api', catalogRouter);
app.use('/api', b2bRouter);
app.use('/api', supportRouter);
// Production only: serves the built client with the deep-link fallback (Student 2, D22). Unset in
// development, where Vite serves the client.
if (process.env.CLIENT_DIST_DIR)
  app.use(
    createClientRouter({
      root: process.env.CLIENT_DIST_DIR,
      privateDirs: process.env.UPLOAD_DIR ? [process.env.UPLOAD_DIR] : [],
    }),
  );

app.use(notFoundHandler);
app.use(errorHandler);
