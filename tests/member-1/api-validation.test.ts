import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { authRateLimit } from '../../server/src/features/auth/router.js';
import { ConfigError, loadServerEnv } from '../../server/src/shared/env.js';
import { RETAIL_USER, TEST_JWT_SECRET, createServerTestApp, tokenFor } from './server-test-app.js';

// These checks run before any database access, so no MongoDB is needed; with input valid the
// routes report the unavailable database truthfully (503), never a fake success.
const app = createServerTestApp();
const bearer = () => `Bearer ${tokenFor(RETAIL_USER.id, 'retail')}`;
const valid = {
  name: 'Test Shopper',
  email: 'shopper@member1.test',
  password: 'synthetic-pass-123',
  role: 'retail',
};
const address = {
  recipient: 'Test Person',
  line1: '1 Example Street',
  city: 'Testville',
  region: 'TX',
  postalCode: '75001',
  country: 'US',
};

describe('auth route validation (before the database)', () => {
  it.each([
    ['missing fields', {}, ['name', 'email', 'password', 'role']],
    ['admin role', { ...valid, role: 'admin' }, ['role']],
    ['business without company', { ...valid, role: 'b2b' }, ['companyName']],
    ['short password', { ...valid, password: 'a'.repeat(11) }, ['password']],
    ['73-byte password', { ...valid, password: 'a'.repeat(73) }, ['password']],
    ['invalid email', { ...valid, email: 'nope' }, ['email']],
    ['unexpected field', { ...valid, passwordHash: 'x' }, ['passwordHash']],
  ])('register: %s -> 400 VALIDATION_ERROR', async (_label, body, fields) => {
    const response = await request(app).post('/api/auth/register').send(body);
    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
    });
    expect(Object.keys(response.body.error.fieldErrors)).toEqual(expect.arrayContaining(fields));
  });

  it('register/login reject a JSON array or string body', async () => {
    for (const body of [[valid], '"text"']) {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send(typeof body === 'string' ? body : JSON.stringify(body));
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('valid input with the database down -> 503 SERVICE_UNAVAILABLE', async () => {
    const register = await request(app).post('/api/auth/register').send(valid);
    expect(register.status).toBe(503);
    expect(register.body).toEqual({
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable' },
    });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: valid.email, password: valid.password });
    expect(login.status).toBe(503);
  });

  it('profile rejects role, email, passwordHash and userId changes', async () => {
    for (const field of ['role', 'email', 'passwordHash', 'userId']) {
      const response = await request(app)
        .patch('/api/users/me')
        .set('Authorization', bearer())
        .send({ name: 'New', [field]: 'b2b' });
      expect(response.status).toBe(400);
      expect(response.body.error.fieldErrors).toEqual({ [field]: 'Unexpected field' });
    }
  });

  it('addresses reject a userId, malformed id and invalid country', async () => {
    for (const [body, field] of [
      [{ ...address, userId: RETAIL_USER.id }, 'userId'],
      [{ ...address, id: '123' }, 'id'],
      [{ ...address, country: 'XX' }, 'country'],
    ] as const) {
      const response = await request(app)
        .post('/api/users/me/addresses')
        .set('Authorization', bearer())
        .send(body);
      expect(response.status).toBe(400);
      expect(Object.keys(response.body.error.fieldErrors)).toContain(field);
    }
  });

  it('every account route requires authentication before reading input', async () => {
    for (const [method, path] of [
      ['get', '/api/auth/me'],
      ['patch', '/api/users/me'],
      ['get', '/api/users/me/addresses'],
      ['post', '/api/users/me/addresses'],
    ] as const) {
      const response = await request(app)[method](path).send({ name: 'x' });
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    }
  });

  it('GET /api/auth/me returns the verified user without private fields', async () => {
    const response = await request(app).get('/api/auth/me').set('Authorization', bearer());
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: RETAIL_USER });
    expect(response.headers['cache-control']).toBe('private, no-store');
  });
});

describe('auth rate limits', () => {
  it('answers 429 RATE_LIMITED with the standard envelope once the limit is reached', async () => {
    const limited = createServerTestApp({
      registerLimiter: authRateLimit({ windowMs: 60_000, limit: 2 }),
    });
    const statuses = [];
    for (let i = 0; i < 3; i++)
      statuses.push((await request(limited).post('/api/auth/register').send({})).status);
    expect(statuses).toEqual([400, 400, 429]);
    const response = await request(limited).post('/api/auth/register').send({});
    expect(response.body).toEqual({
      error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' },
    });
    expect(response.headers['ratelimit-policy']).toBeDefined();
  });
});

describe('server environment validation', () => {
  const base = { MONGODB_URI: 'mongodb://127.0.0.1:27017/solcacao', JWT_SECRET: TEST_JWT_SECRET };

  it('accepts a Mongo URI and a strong secret', () => {
    expect(loadServerEnv(base)).toMatchObject({ port: 4000, mongoUri: base.MONGODB_URI });
  });

  it.each([
    ['missing Mongo URI', { ...base, MONGODB_URI: '' }, 'MONGODB_URI is required'],
    ['non-Mongo URI', { ...base, MONGODB_URI: 'http://x' }, 'MONGODB_URI must start'],
    ['missing secret', { ...base, JWT_SECRET: undefined }, 'JWT_SECRET is required'],
    ['short secret', { ...base, JWT_SECRET: 'abc123XYZ' }, 'at least 32'],
    [
      '.env.example placeholder',
      { ...base, JWT_SECRET: 'replace-with-at-least-32-random-characters-before-phase2' },
      'placeholder',
    ],
    ['repeated characters', { ...base, JWT_SECRET: 'a'.repeat(40) }, 'not random enough'],
  ])('fails clearly for a %s', (_label, env, message) => {
    expect(() => loadServerEnv(env)).toThrow(ConfigError);
    expect(() => loadServerEnv(env)).toThrow(message);
  });

  it('never includes the secret value in the error', () => {
    const secret = 'replace-me-' + 'k'.repeat(30);
    const error = vi.fn();
    try {
      loadServerEnv({ ...base, JWT_SECRET: secret });
    } catch (thrown) {
      error(thrown instanceof Error ? thrown.message : '');
    }
    expect(error).toHaveBeenCalledWith(expect.not.stringContaining(secret));
  });
});
