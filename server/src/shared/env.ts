/**
 * Server configuration, validated once at startup (server/src/index.ts). The API always runs as
 * the HTTP backend, so a MongoDB URI and a strong, non-placeholder JWT secret are required. The
 * mock-mode frontend (npm run dev:client) never loads this file.
 */
export interface ServerEnv {
  port: number;
  /** CORS allowlist: the deployed site's origin plus any other trusted frontend origins. */
  clientOrigins: string[];
  /** Reverse-proxy hops in front of the API (Express `trust proxy`), 0 when it is reached directly. */
  trustProxyHops: number;
  mongoUri: string;
  jwtSecret: string;
}

export class ConfigError extends Error {
  constructor(public problems: string[]) {
    super(`Invalid server configuration:\n- ${problems.join('\n- ')}`);
    this.name = 'ConfigError';
  }
}

export const MIN_JWT_SECRET_LENGTH = 32;
const PLACEHOLDER = /replace|change[-_ ]?me|example|placeholder|your[-_ ]?secret/i;

/** Problems with a JWT secret, or [] if it is usable. Never echoes the value. */
export function jwtSecretProblems(secret: string | undefined): string[] {
  if (!secret) return ['JWT_SECRET is required'];
  const problems: string[] = [];
  if (secret.length < MIN_JWT_SECRET_LENGTH)
    problems.push(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters`);
  if (PLACEHOLDER.test(secret))
    problems.push('JWT_SECRET looks like a placeholder; generate a random value');
  if (new Set(secret).size < 10) problems.push('JWT_SECRET is not random enough');
  return problems;
}

export const DEFAULT_CLIENT_ORIGIN = 'http://localhost:5173';

/**
 * CLIENT_ORIGIN: one origin or a comma-separated allowlist, each exactly scheme://host[:port]
 * (no path or trailing slash). Unset means the local Vite dev server.
 */
export function parseClientOrigins(raw: string | undefined): string[] {
  const origins = (raw ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length ? origins : [DEFAULT_CLIENT_ORIGIN];
}

function isOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.origin === value;
  } catch {
    return false;
  }
}

/**
 * TRUST_PROXY: how many reverse proxies sit in front of the API (1 on Railway), so req.ip, and with
 * it every per-IP rate limit, is the client's address rather than the proxy's. Unset means 0: never
 * trust X-Forwarded-For on a server that clients can reach directly. Invalid values count as 0
 * here; loadServerEnv reports them at startup.
 */
export function parseTrustProxy(raw: string | undefined): number {
  const value = raw?.trim() ?? '';
  return /^\d$/.test(value) ? Number(value) : 0;
}

export function loadServerEnv(env: NodeJS.ProcessEnv = process.env): ServerEnv {
  const problems: string[] = [];
  const mongoUri = env.MONGODB_URI?.trim() ?? '';
  if (!mongoUri) problems.push('MONGODB_URI is required');
  else if (!/^mongodb(\+srv)?:\/\/[^\s]+$/.test(mongoUri))
    problems.push('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  problems.push(...jwtSecretProblems(env.JWT_SECRET));
  const port = Number(env.PORT || 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    problems.push('PORT must be an integer from 1 to 65535');
  const clientOrigins = parseClientOrigins(env.CLIENT_ORIGIN);
  for (const origin of clientOrigins)
    if (!isOrigin(origin))
      problems.push(`CLIENT_ORIGIN entry "${origin}" must be scheme://host[:port] with no path`);
  if (env.NODE_ENV === 'production' && !env.CLIENT_ORIGIN?.trim())
    problems.push('CLIENT_ORIGIN is required in production (the deployed site origin)');
  if (env.TRUST_PROXY?.trim() && !/^\d$/.test(env.TRUST_PROXY.trim()))
    problems.push('TRUST_PROXY must be the number of proxy hops, 0 to 9');
  if (problems.length) throw new ConfigError(problems);
  return {
    port,
    clientOrigins,
    trustProxyHops: parseTrustProxy(env.TRUST_PROXY),
    mongoUri,
    jwtSecret: env.JWT_SECRET ?? '',
  };
}
