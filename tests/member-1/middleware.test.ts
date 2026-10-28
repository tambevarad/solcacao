import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createAuthMiddleware, signAccessToken } from '../../server/src/shared/auth.js';
import {
  BUSINESS_USER,
  RETAIL_USER,
  TEST_JWT_SECRET,
  createServerTestApp,
  tokenFor,
} from './server-test-app.js';

const app = createServerTestApp();
const get = (path: string, token?: string) => {
  const req = request(app).get(path);
  return token === undefined ? req : req.set('Authorization', `Bearer ${token}`);
};
const UNAUTHORIZED = { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } };

describe('signAccessToken', () => {
  it('issues HS256 with sub, role, iss, aud and a one-hour expiry', () => {
    const now = new Date('2026-10-27T12:00:00Z');
    const { token, expiresAt } = signAccessToken(RETAIL_USER, { now });
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());
    expect(header.alg).toBe('HS256');
    const claims = jwt.decode(token);
    expect(claims).toMatchObject({
      sub: RETAIL_USER.id,
      role: 'retail',
      iss: 'solcacao',
      aud: 'solcacao-web',
      exp: now.getTime() / 1000 + 3600,
    });
    expect(expiresAt).toBe('2026-10-27T13:00:00.000Z');
  });
});

describe('requireAuth', () => {
  it('accepts a valid token and loads the current user (role from storage)', async () => {
    // The token claims b2b, but the stored user is retail: the stored role wins.
    const response = await get('/probe/required', tokenFor(RETAIL_USER.id, 'b2b'));
    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual(RETAIL_USER);
  });

  const tampered = () => {
    const [header, , signature] = tokenFor(RETAIL_USER.id, 'retail').split('.');
    const payload = Buffer.from(
      JSON.stringify({
        sub: BUSINESS_USER.id,
        role: 'b2b',
        iss: 'solcacao',
        aud: 'solcacao-web',
        exp: 9999999999,
      }),
    ).toString('base64url');
    return `${header}.${payload}.${signature}`;
  };
  const unsigned = () =>
    `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(
      JSON.stringify({ sub: RETAIL_USER.id, role: 'retail', iss: 'solcacao', aud: 'solcacao-web' }),
    ).toString('base64url')}.`;

  it.each([
    ['missing', undefined],
    ['expired', tokenFor(RETAIL_USER.id, 'retail', { expiresIn: -10 })],
    ['modified payload', tampered()],
    ['wrong audience', tokenFor(RETAIL_USER.id, 'retail', { audience: 'someone-else' })],
    ['wrong issuer', tokenFor(RETAIL_USER.id, 'retail', { issuer: 'evil' })],
    ['wrong secret', tokenFor(RETAIL_USER.id, 'retail', { secret: 'x'.repeat(40) })],
    ['alg none', unsigned()],
    ['mock adapter token', `mock:${RETAIL_USER.id}`],
    ['malformed subject', tokenFor('not-an-id', 'retail')],
    ['deleted or inactive user', tokenFor('0000000000000000000000ff', 'retail')],
  ])('rejects a %s token with 401 and the standard envelope', async (_label, token) => {
    const response = await get('/probe/required', token);
    expect(response.status).toBe(401);
    expect(response.body).toEqual(UNAUTHORIZED);
  });

  it('rejects a non-Bearer scheme', async () => {
    const response = await request(app)
      .get('/probe/required')
      .set('Authorization', `Basic ${Buffer.from('a:b').toString('base64')}`);
    expect(response.status).toBe(401);
  });

  it('reports 503 (not 401) when the user store is unreachable', async () => {
    const outage = createServerTestApp({ databaseReady: false });
    const response = await request(outage)
      .get('/probe/required')
      .set('Authorization', `Bearer ${tokenFor(RETAIL_USER.id, 'retail')}`);
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('maps a MongoDB outage thrown while loading the user to 503', async () => {
    const outage = new Error('connection lost');
    outage.name = 'MongoNetworkError';
    const { requireAuth } = createAuthMiddleware({
      loadUser: vi.fn().mockRejectedValue(outage),
      isDatabaseReady: () => true,
    });
    const route = vi.fn();
    const outageApp = express().get('/probe', requireAuth, route);
    const response = await request(outageApp)
      .get('/probe')
      .set('Authorization', `Bearer ${tokenFor(RETAIL_USER.id, 'retail')}`);
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(route).not.toHaveBeenCalled();
  });
});

describe('optionalAuth', () => {
  it('continues as a guest without an Authorization header', async () => {
    const response = await get('/probe/optional');
    expect(response.status).toBe(200);
    expect(response.body.data.user).toBeNull();
  });

  it('sets the user for a valid token', async () => {
    const response = await get('/probe/optional', tokenFor(BUSINESS_USER.id, 'b2b'));
    expect(response.body.data.user).toEqual(BUSINESS_USER);
  });

  it('rejects a supplied invalid token instead of downgrading to guest', async () => {
    const response = await get(
      '/probe/optional',
      tokenFor(RETAIL_USER.id, 'retail', { expiresIn: -1 }),
    );
    expect(response.status).toBe(401);
  });
});

describe('requireRole', () => {
  it('lets a business user through and refuses retail with 403 FORBIDDEN', async () => {
    expect((await get('/probe/b2b', tokenFor(BUSINESS_USER.id, 'b2b'))).status).toBe(200);
    const retail = await get('/probe/b2b', tokenFor(RETAIL_USER.id, 'retail'));
    expect(retail.status).toBe(403);
    expect(retail.body.error.code).toBe('FORBIDDEN');
  });

  it('authenticates on its own when used without requireAuth (missing token -> 401)', async () => {
    expect((await get('/probe/b2b-alone')).status).toBe(401);
    expect((await get('/probe/b2b-alone', tokenFor(BUSINESS_USER.id, 'b2b'))).status).toBe(200);
  });
});

it('the test secret is the one the middleware verifies with', () => {
  expect(process.env.JWT_SECRET).toBe(TEST_JWT_SECRET);
});
