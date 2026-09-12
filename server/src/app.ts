import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './features/auth/router.js';
import { shellRouter } from './features/shell/router.js';
import { catalogRouter } from './features/catalog/router.js';
import { b2bRouter } from './features/b2b/router.js';
import { supportRouter } from './features/support/router.js';
export const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (_req, res) => res.json({ data: { status: 'ok', stage: 'template' } }));
app.use('/api', authRouter);
app.use('/api', shellRouter);
app.use('/api', catalogRouter);
app.use('/api', b2bRouter);
app.use('/api', supportRouter);

app.use((_req, res) => {
  res
    .status(404)
    .json({ error: { code: 'NOT_FOUND', message: 'Route not found or not implemented' } });
});
app.use(
  (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status =
      error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
        ? error.status
        : 500;
    res.status(status).json({
      error: {
        code: status === 500 ? 'INTERNAL_ERROR' : 'INVALID_REQUEST',
        message: status === 500 ? 'Unexpected server error' : 'Invalid request',
      },
    });
  },
);
