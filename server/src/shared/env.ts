/**
 * Server configuration, validated once at startup (server/src/index.ts). The API always runs as
 * the HTTP backend, so a MongoDB URI and a strong, non-placeholder JWT secret are required. The
 * mock-mode frontend (npm run dev:client) never loads this file.
 */
export interface ServerEnv {
  port: number;
  clientOrigin: string;
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
  if (problems.length) throw new ConfigError(problems);
  return {
    port,
    clientOrigin: env.CLIENT_ORIGIN || 'http://localhost:5173',
    mongoUri,
    jwtSecret: env.JWT_SECRET ?? '',
  };
}
