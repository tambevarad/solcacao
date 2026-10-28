import { Router, type ErrorRequestHandler, type Request, type RequestHandler } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import type { User } from '../../../../contracts/index.js';
import { idSchema } from '../../../../contracts/validation.js';
import { requireAuth, requireRole } from '../../shared/auth.js';
import { notifyQuote } from '../support/notifications.js';
import { B2bError, sendError } from './errors.js';
import { findOwnRequest, submitQuote, toReceipt } from './service.js';
import { createLocalQuoteStorage, type QuoteFileStorage } from './storage.js';
import type { NotifyQuote } from './types.js';
import {
  MAX_DESIGN_FILE_BYTES,
  MAX_METADATA_BYTES,
  checkDesignFile,
  parseMetadata,
} from './upload.js';

export interface B2bRouterDependencies {
  /** Student 1's requireAuth: 401 envelope for a missing, invalid or expired token. */
  requireAuth: RequestHandler;
  /** Student 1's requireRole('b2b'): 403 envelope for any other role. */
  requireB2b: RequestHandler;
  /** Student 5's notification bridge. */
  notifyQuote: NotifyQuote;
  storage: QuoteFileStorage;
  /** Defaults to the shared mongoose connection, which Student 1's connectDb opens. */
  isDatabaseReady?: () => boolean;
}

function signedInUser(req: Request): User {
  if (!req.user || !idSchema.safeParse(req.user.id).success)
    throw new B2bError(401, 'UNAUTHORIZED', 'Authentication required');
  return req.user;
}

function isDatabaseOutage(error: unknown): boolean {
  return (
    error instanceof Error &&
    /^Mongo(Network|ServerSelection|NotConnected)Error$|^MongooseServerSelectionError$/.test(
      error.name,
    )
  );
}

function isClientError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status < 500
  );
}

/**
 * POST /api/b2b/quote, GET /api/b2b/quotes/:id and GET /api/b2b/quotes/:id/file (docs/api.json).
 * Authentication and role checks run before multer reads any file. Dependencies are injected so
 * tests and the later real ports use the same routes.
 */
export function createB2bRouter({
  requireAuth,
  requireB2b,
  notifyQuote,
  storage,
  isDatabaseReady = () => mongoose.connection.readyState === 1,
}: B2bRouterDependencies): Router {
  const router = Router();
  // Memory storage: nothing reaches the disk until every check has passed. One text field
  // (metadata) and one file; anything more is rejected by multer before the handler runs.
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_DESIGN_FILE_BYTES, files: 1, fields: 1, fieldSize: MAX_METADATA_BYTES },
  }).fields([{ name: 'designFile', maxCount: 1 }]);

  /** Any failure while parsing the multipart body is the client's: 413 for size, else 400. */
  const parseUpload: RequestHandler = (req, res, next) =>
    upload(req, res, (error?: unknown) => {
      if (!error) return next();
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE')
        return next(
          new B2bError(413, 'FILE_TOO_LARGE', 'File too large', { designFile: 'Maximum 5 MiB' }),
        );
      const field = error instanceof multer.MulterError ? (error.field ?? 'request') : 'request';
      next(
        new B2bError(400, 'VALIDATION_ERROR', 'Invalid request', {
          [field]: 'Unexpected, oversized or malformed form part',
        }),
      );
    });

  function requireDatabase() {
    if (!isDatabaseReady()) throw new B2bError(503, 'SERVICE_UNAVAILABLE', 'Service unavailable');
  }

  async function ownRecord(user: User, rawId: unknown) {
    const id = idSchema.safeParse(rawId);
    if (!id.success)
      throw new B2bError(400, 'VALIDATION_ERROR', 'Invalid request', { id: 'Malformed id' });
    requireDatabase();
    const record = await findOwnRequest(user, id.data);
    if (!record) throw new B2bError(404, 'NOT_FOUND', 'Quote request not found');
    return record;
  }

  router.post('/b2b/quote', requireAuth, requireB2b, parseUpload, async (req, res) => {
    const user = signedInUser(req);
    const body: Record<string, unknown> = req.body ?? {};
    const unexpected = Object.keys(body).filter((key) => key !== 'metadata');
    if (unexpected.length)
      throw new B2bError(
        400,
        'VALIDATION_ERROR',
        'Invalid request',
        Object.fromEntries(unexpected.map((key) => [key, 'Unexpected field'])),
      );
    const input = parseMetadata(body.metadata);
    const files = req.files && !Array.isArray(req.files) ? req.files.designFile : undefined;
    const file = checkDesignFile(files?.[0]);
    requireDatabase();
    const receipt = await submitQuote({ user, input, file, storage, notifyQuote });
    res.status(201).json({ data: receipt });
  });

  router.get('/b2b/quotes/:id', requireAuth, requireB2b, async (req, res) => {
    const record = await ownRecord(signedInUser(req), req.params.id);
    res.set('Cache-Control', 'private, no-store').json({ data: toReceipt(record) });
  });

  router.get('/b2b/quotes/:id/file', requireAuth, requireB2b, async (req, res) => {
    const record = await ownRecord(signedInUser(req), req.params.id);
    res.set({ 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
    res.attachment(record.fileOriginalName);
    res.type('application/pdf');
    res.sendFile(storage.resolve(record.fileKey), (error) => {
      if (!error || res.headersSent) return;
      res.removeHeader('Content-Disposition');
      res.removeHeader('Content-Type');
      sendError(res, new B2bError(404, 'NOT_FOUND', 'File not found'));
    });
  });

  const handleErrors: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof B2bError) return sendError(res, error);
    if (isDatabaseOutage(error))
      return sendError(res, new B2bError(503, 'SERVICE_UNAVAILABLE', 'Service unavailable'));
    if (isClientError(error))
      return sendError(res, new B2bError(400, 'VALIDATION_ERROR', 'Invalid request'));
    console.error('[b2b] Unexpected error', error);
    sendError(res, new B2bError(500, 'INTERNAL_ERROR', 'Unexpected server error'));
  };
  router.use(handleErrors);
  return router;
}

/**
 * Mounted by server/src/app.ts with Student 1's requireAuth/requireRole('b2b') and Student 5's
 * notifyQuote (docs/contracts.md "Server ports").
 */
export const b2bRouter = createB2bRouter({
  requireAuth,
  requireB2b: requireRole('b2b'),
  notifyQuote,
  storage: createLocalQuoteStorage(process.env.UPLOAD_DIR || 'server/storage'),
});
