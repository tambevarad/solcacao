import { Router, type RequestHandler, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { User } from '../../../../contracts/index.js';
import {
  addressSchema,
  loginSchema,
  profileSchema,
  registerSchema,
} from '../../../../client/src/features/auth/rules.js';
import { requireAuth as defaultRequireAuth, signAccessToken } from '../../shared/auth.js';
import { isDatabaseReady as defaultIsDatabaseReady } from '../../shared/db.js';
import {
  AppError,
  errorHandler,
  sendError,
  serviceUnavailable,
  unauthorized,
} from '../../shared/errors.js';
import { parseBody } from '../../shared/validation.js';
import {
  authenticate,
  listAddresses,
  registerUser,
  saveAddress,
  updateProfile,
} from './service.js';

/** Auth throttles: 429 RATE_LIMITED envelope, standard RateLimit headers, per client IP. */
export function authRateLimit({
  windowMs,
  limit,
  skipSuccessfulRequests = false,
}: {
  windowMs: number;
  limit: number;
  skipSuccessfulRequests?: boolean;
}): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) =>
      sendError(res, new AppError(429, 'RATE_LIMITED', 'Too many attempts, try again later')),
  });
}

export interface AuthRouterDependencies {
  requireAuth?: RequestHandler;
  isDatabaseReady?: () => boolean;
  /** Counts failed sign-ins only. Default: 10 failures per 15 minutes per IP. */
  loginLimiter?: RequestHandler;
  /** Default: 10 registrations per hour per IP. */
  registerLimiter?: RequestHandler;
}

const noStore = (res: Response) => res.set('Cache-Control', 'private, no-store');

function signedInUser(user: User | undefined): User {
  if (!user) throw unauthorized();
  return user;
}

/**
 * POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, PATCH /api/users/me and
 * GET/POST /api/users/me/addresses (docs/api.json). Input is validated with the shared strict
 * schemas before the database is touched; only parsed fields reach the service.
 */
export function createAuthRouter({
  requireAuth = defaultRequireAuth,
  isDatabaseReady = defaultIsDatabaseReady,
  loginLimiter = authRateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
  }),
  registerLimiter = authRateLimit({ windowMs: 60 * 60 * 1000, limit: 10 }),
}: AuthRouterDependencies = {}): Router {
  const router = Router();

  function requireDatabase() {
    if (!isDatabaseReady()) throw serviceUnavailable();
  }

  router.post('/auth/register', registerLimiter, async (req, res) => {
    const input = parseBody(registerSchema, req.body);
    requireDatabase();
    const user = await registerUser(input);
    noStore(res)
      .status(201)
      .json({ data: { user, ...signAccessToken(user) } });
  });

  router.post('/auth/login', loginLimiter, async (req, res) => {
    const input = parseBody(loginSchema, req.body);
    requireDatabase();
    const user = await authenticate(input.email, input.password);
    noStore(res).json({ data: { user, ...signAccessToken(user) } });
  });

  router.get('/auth/me', requireAuth, (req, res) => {
    noStore(res).json({ data: signedInUser(req.user) });
  });

  router.patch('/users/me', requireAuth, async (req, res) => {
    const user = signedInUser(req.user);
    const input = parseBody(profileSchema, req.body);
    requireDatabase();
    noStore(res).json({ data: await updateProfile(user, input) });
  });

  router.get('/users/me/addresses', requireAuth, async (req, res) => {
    const user = signedInUser(req.user);
    requireDatabase();
    noStore(res).json({ data: await listAddresses(user.id) });
  });

  router.post('/users/me/addresses', requireAuth, async (req, res) => {
    const user = signedInUser(req.user);
    const input = parseBody(addressSchema, req.body);
    requireDatabase();
    noStore(res).json({ data: await saveAddress(user.id, input) });
  });

  router.use(errorHandler);
  return router;
}

/** Mounted by server/src/app.ts with the real middleware, database and rate limits. */
export const authRouter = createAuthRouter();
