import type { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { Role, User } from '../../../contracts/index.js';
import { idSchema } from '../../../contracts/validation.js';
import { findActiveUser } from '../features/auth/service.js';
import { isDatabaseReady } from './db.js';
import { jwtSecretProblems } from './env.js';
import {
  AppError,
  forbidden,
  isDatabaseOutage,
  sendError,
  serviceUnavailable,
  unauthorized,
} from './errors.js';

// Published for every feature (docs/contracts.md): protected handlers read the verified user here.
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const JWT_ISSUER = 'solcacao';
export const JWT_AUDIENCE = 'solcacao-web';
export const TOKEN_TTL_SECONDS = 60 * 60; // decision D09: one hour, no refresh token

/** JWT_SECRET read at call time (validated at startup by loadServerEnv). */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || jwtSecretProblems(secret).length)
    throw new AppError(500, 'INTERNAL_ERROR', 'Unexpected server error');
  return secret;
}

/** HS256 access token: sub = user id, role, iss, aud, exp (one hour). */
export function signAccessToken(
  user: Pick<User, 'id' | 'role'>,
  { secret = getJwtSecret(), now = new Date() }: { secret?: string; now?: Date } = {},
) {
  const issuedAt = Math.floor(now.getTime() / 1000);
  const token = jwt.sign({ role: user.role, iat: issuedAt }, secret, {
    algorithm: 'HS256',
    subject: user.id,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: TOKEN_TTL_SECONDS,
  });
  return { token, expiresAt: new Date((issuedAt + TOKEN_TTL_SECONDS) * 1000).toISOString() };
}

export interface AuthMiddlewareOptions {
  /** Loads the current active user for a verified subject. Defaults to the users collection. */
  loadUser?: (id: string) => Promise<User | null>;
  secret?: () => string;
  isDatabaseReady?: () => boolean;
}

/** Bearer token from the Authorization header: undefined if absent, null if malformed. */
function bearerToken(req: Request): string | null | undefined {
  const header = req.get('authorization');
  if (header === undefined) return undefined;
  const match = header.match(/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/);
  return match ? match[1] : null;
}

/**
 * requireAuth, optionalAuth and requireRole over injectable user loading, so tests can exercise
 * token rules without a database. Every failure ends the request with an error envelope; none
 * falls through to the route.
 */
export function createAuthMiddleware({
  loadUser = findActiveUser,
  secret = getJwtSecret,
  isDatabaseReady: databaseReady = isDatabaseReady,
}: AuthMiddlewareOptions = {}) {
  /** Verify signature, algorithm, expiry, issuer and audience, then load the current user. */
  async function authenticate(token: string | null): Promise<User> {
    if (!token) throw unauthorized();
    let subject: string;
    try {
      const payload = jwt.verify(token, secret(), {
        algorithms: ['HS256'],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
      if (typeof payload === 'string' || !idSchema.safeParse(payload.sub).success)
        throw unauthorized();
      subject = String(payload.sub);
    } catch (error) {
      if (error instanceof AppError && error.status !== 401) throw error;
      throw unauthorized();
    }
    if (!databaseReady()) throw serviceUnavailable();
    // The role always comes from the stored user, never from the token or a request body.
    const user = await loadUser(subject.toLowerCase());
    if (!user) throw unauthorized();
    return user;
  }

  function failure(error: unknown): AppError {
    if (error instanceof AppError) return error;
    if (isDatabaseOutage(error)) return serviceUnavailable();
    console.error(
      '[auth] Unexpected error while authenticating:',
      error instanceof Error ? error.name : 'non-Error value thrown',
    );
    return new AppError(500, 'INTERNAL_ERROR', 'Unexpected server error');
  }

  /** 401 for a missing, malformed, invalid or expired token, or a deleted/inactive user. */
  const requireAuth: RequestHandler = async (req, res, next) => {
    try {
      req.user = await authenticate(bearerToken(req) ?? null);
    } catch (error) {
      return sendError(res, failure(error));
    }
    next();
  };

  /** Guest without an Authorization header; a supplied but invalid token is still 401. */
  const optionalAuth: RequestHandler = async (req, res, next) => {
    const token = bearerToken(req);
    if (token === undefined) return next();
    try {
      req.user = await authenticate(token);
    } catch (error) {
      return sendError(res, failure(error));
    }
    next();
  };

  /** 403 for a signed-in user with another role. Authenticates first if requireAuth did not run. */
  const requireRole =
    (role: Role): RequestHandler =>
    async (req, res, next) => {
      try {
        req.user ??= await authenticate(bearerToken(req) ?? null);
      } catch (error) {
        return sendError(res, failure(error));
      }
      if (req.user.role !== role) return sendError(res, forbidden('Insufficient role'));
      next();
    };

  return { requireAuth, optionalAuth, requireRole };
}

/** The ports for every feature router (docs/contracts.md, "Server ports"). */
export const { requireAuth, optionalAuth, requireRole } = createAuthMiddleware();
