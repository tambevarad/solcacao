import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// app.ts reads these when it is first imported (models cannot be compiled twice, so no reset).
vi.hoisted(() => {
  process.env.CLIENT_ORIGIN = 'https://site.example,http://localhost:5173';
  process.env.TRUST_PROXY = '1';
});

import { app } from '../../server/src/app.js';
import { authRateLimit } from '../../server/src/features/auth/router.js';
import { describeForLog } from '../../server/src/shared/errors.js';
import {
  ConfigError,
  loadServerEnv,
  parseClientOrigins,
  parseTrustProxy,
} from '../../server/src/shared/env.js';

const base = {
  MONGODB_URI: 'mongodb://127.0.0.1:27017/solcacao',
  JWT_SECRET: 'q8Vt2LmZx4Rk9Pw1Ns6Hy3Jd7Bf0Gc5A',
};

const problemsOf = (env: NodeJS.ProcessEnv) => {
  try {
    loadServerEnv(env);
    return [];
  } catch (error) {
    if (error instanceof ConfigError) return error.problems;
    throw error;
  }
};

describe('CLIENT_ORIGIN allowlist', () => {
  it('accepts one origin or a comma-separated list, defaulting to the Vite dev server', () => {
    expect(parseClientOrigins(undefined)).toEqual(['http://localhost:5173']);
    expect(parseClientOrigins(' https://a.example , http://localhost:5173 ')).toEqual([
      'https://a.example',
      'http://localhost:5173',
    ]);
    expect(
      loadServerEnv({ ...base, CLIENT_ORIGIN: 'https://a.example,https://b.example' })
        .clientOrigins,
    ).toEqual(['https://a.example', 'https://b.example']);
  });

  it('rejects entries with a path, trailing slash or another scheme', () => {
    for (const bad of ['https://a.example/', 'https://a.example/app', 'ftp://a.example', '*'])
      expect(problemsOf({ ...base, CLIENT_ORIGIN: bad }).join()).toMatch(/CLIENT_ORIGIN entry/);
  });

  it('is required in production, where the deployed origin must be named', () => {
    expect(problemsOf({ ...base, NODE_ENV: 'production' })).toContain(
      'CLIENT_ORIGIN is required in production (the deployed site origin)',
    );
    expect(
      problemsOf({ ...base, NODE_ENV: 'production', CLIENT_ORIGIN: 'https://site.example' }),
    ).toEqual([]);
  });
});

describe('the app CORS policy', () => {
  it('grants only allowlisted origins', async () => {
    const allowed = await request(app).get('/api/nope').set('Origin', 'https://site.example');
    expect(allowed.headers['access-control-allow-origin']).toBe('https://site.example');
    const local = await request(app).get('/api/nope').set('Origin', 'http://localhost:5173');
    expect(local.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    const other = await request(app).get('/api/nope').set('Origin', 'https://evil.example');
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('trusts X-Forwarded-For only for the configured number of proxy hops', () => {
    expect(app.get('trust proxy')).toBe(1);
  });
});

describe('TRUST_PROXY', () => {
  it('defaults to 0 and reports a non-numeric value at startup', () => {
    expect(parseTrustProxy(undefined)).toBe(0);
    expect(parseTrustProxy('1')).toBe(1);
    expect(parseTrustProxy('true')).toBe(0);
    expect(loadServerEnv({ ...base, TRUST_PROXY: '1' }).trustProxyHops).toBe(1);
    expect(problemsOf({ ...base, TRUST_PROXY: 'true' })).toContain(
      'TRUST_PROXY must be the number of proxy hops, 0 to 9',
    );
  });

  it('behind one proxy, the login throttle counts each client separately', async () => {
    const app = express();
    app.set('trust proxy', parseTrustProxy('1'));
    app.post('/login', authRateLimit({ windowMs: 60_000, limit: 1 }), (_req, res) => {
      res.json({ data: 'ok' });
    });
    const from = (ip: string) => request(app).post('/login').set('X-Forwarded-For', ip);
    expect((await from('203.0.113.1')).status).toBe(200);
    expect((await from('203.0.113.1')).status).toBe(429);
    // Without trust proxy both would share the proxy's address and this would be 429 too.
    expect((await from('203.0.113.2')).status).toBe(200);
  });
});

describe('error logging', () => {
  it('logs MongoDB errors by name and code only, never their message', () => {
    const duplicate = Object.assign(
      new Error('E11000 duplicate key error dup key: { email: "someone@member1.test" }'),
      { name: 'MongoServerError', code: 11000 },
    );
    expect(describeForLog(duplicate)).toBe('MongoServerError (code 11000)');
    expect(describeForLog(new TypeError('x is undefined'))).toBe('TypeError: x is undefined');
    expect(describeForLog('text')).toBe('non-Error value thrown');
  });

  it('logs Mongoose errors by name only: a CastError message quotes the value', () => {
    const cast = new mongoose.Error.CastError('ObjectId', 'someone@member1.test', '_id');
    expect(describeForLog(cast)).toBe('CastError');
    expect(describeForLog(cast)).not.toContain('someone@member1.test');
  });
});
