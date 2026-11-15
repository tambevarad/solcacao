import { mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { vi } from 'vitest';
import type { QuoteInput, Role } from '../../contracts/index.js';
import { createB2bRouter } from '../../server/src/features/b2b/router.js';
import { createLocalQuoteStorage } from '../../server/src/features/b2b/storage.js';
import type { NotifyQuote } from '../../server/src/features/b2b/types.js';

/**
 * Test doubles for Student 1's requireAuth / requireRole('b2b'), used only in tests. The header
 * `x-test-user: <24-hex id>:<role>` stands in for a verified JWT subject and role.
 */
const testRequireAuth: RequestHandler = (req, res, next) => {
  const [id, role] = (req.get('x-test-user') ?? '').split(':');
  if (!id || (role !== 'b2b' && role !== 'retail')) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    return;
  }
  req.user = { id, name: 'Test', email: `${id}@example.test`, role, companyName: 'Test Co' };
  next();
};
const testRequireB2b: RequestHandler = (req, res, next) => {
  if (req.user?.role === 'b2b') return next();
  res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Business account required' } });
};

export const BUSINESS_A = '0000000000000000000000a1:b2b';
export const BUSINESS_B = '0000000000000000000000b2:b2b';
export const RETAIL = '0000000000000000000000c3:retail';

export const validInput = (overrides: Partial<QuoteInput> = {}): QuoteInput => ({
  cacaoProfile: 'dark70',
  quantity: 250,
  packaging: 'giftBox',
  companyName: 'Test Co',
  contactEmail: 'buyer@example.test',
  notes: 'Synthetic test request',
  locale: 'en',
  requestId: '33333333-3333-4333-8333-333333333333',
  ...overrides,
});

/** Synthetic minimal PDF bytes; never a real corporate file. */
export const pdfBytes = (marker = 'a') => Buffer.from(`%PDF-1.4\n% synthetic ${marker}\n%%EOF\n`);

export async function createQuoteTestApp(
  options: {
    notifyQuote?: NotifyQuote;
    isDatabaseReady?: () => boolean;
    /** Reuse an existing upload directory, e.g. to model a server restart. */
    uploadRoot?: string;
  } = {},
) {
  const uploadRoot = options.uploadRoot ?? (await mkdtemp(path.join(tmpdir(), 'solcacao-b2b-')));
  const notifyQuote = vi.fn<NotifyQuote>(options.notifyQuote ?? (async () => 'sent'));
  const app = express();
  app.use(express.json());
  app.use(
    '/api',
    createB2bRouter({
      requireAuth: testRequireAuth,
      requireB2b: testRequireB2b,
      notifyQuote,
      storage: createLocalQuoteStorage(uploadRoot),
      isDatabaseReady: options.isDatabaseReady,
    }),
  );
  const storedFiles = async () => {
    try {
      return await readdir(path.join(uploadRoot, 'b2b'));
    } catch {
      return [];
    }
  };
  const submit = (
    user: string | null,
    {
      metadata = JSON.stringify(validInput()),
      file = pdfBytes(),
      filename = 'brand.pdf',
      contentType = 'application/pdf',
    }: { metadata?: string; file?: Buffer | null; filename?: string; contentType?: string } = {},
  ) => {
    let call = request(app).post('/api/b2b/quote');
    if (user) call = call.set('x-test-user', user);
    call = call.field('metadata', metadata);
    if (file) call = call.attach('designFile', file, { filename, contentType });
    return call;
  };
  return { app, uploadRoot, notifyQuote, storedFiles, submit };
}
