import express, { type RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { Role, User } from '../../contracts/index.js';
import { createAuthRouter } from '../../server/src/features/auth/router.js';
import { createAuthMiddleware } from '../../server/src/shared/auth.js';
import { errorHandler, notFoundHandler } from '../../server/src/shared/errors.js';

/** Synthetic signing secret for tests only (random-looking, 48 chars, never a real secret). */
export const TEST_JWT_SECRET = 'm1-test-Qw7Zp2Lk9Vx4Rt6Yb8Nc3Hd5Fg1Js0Ma2Ue7Io4Pq';
process.env.JWT_SECRET = TEST_JWT_SECRET;

export const RETAIL_USER: User = {
  id: '0000000000000000000000a1',
  name: 'Retail Tester',
  email: 'retail@member1.test',
  role: 'retail',
};
export const BUSINESS_USER: User = {
  id: '0000000000000000000000b2',
  name: 'Business Tester',
  email: 'buyer@member1.test',
  role: 'b2b',
  companyName: 'Test Co',
};

/** Sign a token with arbitrary claims/options for the rejection cases. */
export function tokenFor(
  sub: string,
  role: Role,
  overrides: { secret?: string; issuer?: string; audience?: string; expiresIn?: number } = {},
) {
  return jwt.sign({ role }, overrides.secret ?? TEST_JWT_SECRET, {
    algorithm: 'HS256',
    subject: sub,
    issuer: overrides.issuer ?? 'solcacao',
    audience: overrides.audience ?? 'solcacao-web',
    expiresIn: overrides.expiresIn ?? 3600,
  });
}

/**
 * The real middleware and auth router over an in-memory user table instead of MongoDB. Routes that
 * need the database report it unavailable unless `databaseReady` is true.
 */
export function createServerTestApp({
  users = [RETAIL_USER, BUSINESS_USER],
  databaseReady = true,
  loginLimiter,
  registerLimiter,
}: {
  users?: User[];
  databaseReady?: boolean;
  loginLimiter?: RequestHandler;
  registerLimiter?: RequestHandler;
} = {}) {
  const middleware = createAuthMiddleware({
    loadUser: async (id) => users.find((user) => user.id === id) ?? null,
    isDatabaseReady: () => databaseReady,
  });
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  const pass: RequestHandler = (_req, _res, next) => next();
  app.use(
    '/api',
    createAuthRouter({
      requireAuth: middleware.requireAuth,
      isDatabaseReady: () => false, // service calls would need MongoDB: see persistence.test.ts
      loginLimiter: loginLimiter ?? pass,
      registerLimiter: registerLimiter ?? pass,
    }),
  );
  // Probe routes for each port.
  const ok: RequestHandler = (req, res) => {
    res.json({ data: { user: req.user ?? null } });
  };
  app.get('/probe/required', middleware.requireAuth, ok);
  app.get('/probe/optional', middleware.optionalAuth, ok);
  app.get('/probe/b2b', middleware.requireAuth, middleware.requireRole('b2b'), ok);
  app.get('/probe/b2b-alone', middleware.requireRole('b2b'), ok);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
