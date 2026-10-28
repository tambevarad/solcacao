import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../../server/src/app.js';
import { signAccessToken } from '../../server/src/shared/auth.js';
import { ensureIndexes } from '../../server/src/shared/db.js';

// Phase 2 integration: the mounted routers run with Student 1's real middleware and Student 5's
// notifyQuote, against a real MongoDB. No test doubles. Skipped without TEST_MONGODB_URI.
const base = process.env.TEST_MONGODB_URI;

describe.skipIf(!base)('mounted API with real authentication (real MongoDB)', () => {
  let retail = '';
  let business = '';

  beforeAll(async () => {
    process.env.JWT_SECRET ??= randomBytes(32).toString('hex');
    const url = new URL(base!);
    url.pathname = `/solcacao_test_member2_${process.pid}`;
    await mongoose.connect(url.toString(), { serverSelectionTimeoutMS: 5000 });
    await ensureIndexes();
    const register = async (body: object) => {
      const response = await request(app).post('/api/auth/register').send(body);
      expect(response.status).toBe(201);
      return response.body.data.token as string;
    };
    retail = await register({
      name: 'Integration Shopper',
      email: 'shopper@solcacao.test',
      password: 'integration-pass-123',
      role: 'retail',
    });
    business = await register({
      name: 'Integration Buyer',
      email: 'buyer@solcacao.test',
      password: 'integration-pass-456',
      role: 'b2b',
      companyName: 'Fictional Integration Co',
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('reports a connected database on the health route', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ status: 'ok', database: 'connected' });
  });

  it('opens the saved cart for a signed-in shopper and refuses everyone else', async () => {
    expect((await request(app).get('/api/cart')).status).toBe(401);
    const forged = signAccessToken(
      { id: '0000000000000000000000a1', role: 'retail' },
      { secret: randomBytes(32).toString('hex') },
    ).token;
    expect(
      (await request(app).get('/api/cart').set('Authorization', `Bearer ${forged}`)).status,
    ).toBe(401);
    const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${retail}`);
    expect(cart.status).toBe(200);
    expect(cart.body.data.items).toEqual([]);
  });

  it('keeps quotes for business accounts: 401 signed out, 403 retail, past the guard for b2b', async () => {
    const quote = (token?: string) => {
      const call = request(app).post('/api/b2b/quote').field('metadata', '{}');
      return token ? call.set('Authorization', `Bearer ${token}`) : call;
    };
    expect((await quote()).status).toBe(401);
    const retailAttempt = await quote(retail);
    expect(retailAttempt.status).toBe(403);
    expect(retailAttempt.body.error.code).toBe('FORBIDDEN');
    // A business account passes authentication and the role check; the empty upload then fails
    // validation, which proves the request reached the quote handler.
    const businessAttempt = await quote(business);
    expect(businessAttempt.status).toBe(400);
    expect(businessAttempt.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a checkout that carries an invalid token instead of treating it as a guest', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer not.a.token')
      .send({});
    expect(response.status).toBe(401);
  });
});
