import bcrypt from 'bcrypt';
import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthRouter } from '../../server/src/features/auth/router.js';
import {
  AddressModel,
  CorporatePartnerModel,
  UserModel,
} from '../../server/src/features/auth/models.js';
import { ensureAuthIndexes } from '../../server/src/features/auth/service.js';
import { connectDb, disconnectDb, isDatabaseReady } from '../../server/src/shared/db.js';
import { errorHandler } from '../../server/src/shared/errors.js';
import { UnsafeTestDatabaseError, memberTestMongoUri } from './mongo.js';
import './server-test-app.js'; // sets the synthetic JWT_SECRET

describe('test database guard', () => {
  it.each([
    'mongodb+srv://cluster.example.net/solcacao',
    'mongodb://db.example.com:27017/solcacao',
  ])('refuses %s', (uri) => {
    expect(() => memberTestMongoUri({ TEST_MONGODB_URI: uri })).toThrow(UnsafeTestDatabaseError);
  });

  it('refuses the application database and production mode', () => {
    const uri = 'mongodb://127.0.0.1:27017/solcacao';
    expect(() => memberTestMongoUri({ TEST_MONGODB_URI: uri, MONGODB_URI: uri })).toThrow();
    expect(() => memberTestMongoUri({ TEST_MONGODB_URI: uri, NODE_ENV: 'production' })).toThrow();
  });

  it('switches a local URI to the member-1 test database', () => {
    expect(memberTestMongoUri({ TEST_MONGODB_URI: 'mongodb://127.0.0.1:27017/anything' })).toBe(
      `mongodb://127.0.0.1:27017/solcacao_test_member1_${process.pid}`,
    );
  });
});

const uri = memberTestMongoUri();

describe.skipIf(!uri)('auth persistence (real MongoDB)', () => {
  const app = express();
  app.use(express.json());
  const pass: express.RequestHandler = (_req, _res, next) => next();
  app.use('/api', createAuthRouter({ loginLimiter: pass, registerLimiter: pass }));
  app.use(errorHandler);

  const PASSWORD = 'synthetic-pass-123';
  const retail = {
    name: 'Retail Tester',
    email: 'Retail@Member1.test',
    password: PASSWORD,
    role: 'retail',
  };
  const business = {
    name: 'Business Tester',
    email: 'buyer@member1.test',
    password: PASSWORD,
    role: 'b2b',
    companyName: 'Test Co',
  };
  const address = {
    recipient: 'Test Person',
    line1: '1 Example Street',
    city: 'Testville',
    region: 'TX',
    postalCode: '75001',
    country: 'US',
  };
  const register = (body: object) => request(app).post('/api/auth/register').send(body);
  const login = (email: string, password: string) =>
    request(app).post('/api/auth/login').send({ email, password });
  const as = (token: string) => ({
    get: (path: string) => request(app).get(path).set('Authorization', `Bearer ${token}`),
    post: (path: string, body: object) =>
      request(app).post(path).set('Authorization', `Bearer ${token}`).send(body),
    patch: (path: string, body: object) =>
      request(app).patch(path).set('Authorization', `Bearer ${token}`).send(body),
  });

  beforeAll(async () => {
    await connectDb(uri ?? '');
    await ensureAuthIndexes();
  });
  beforeEach(async () => {
    await Promise.all([
      UserModel.deleteMany({}),
      CorporatePartnerModel.deleteMany({}),
      AddressModel.deleteMany({}),
    ]);
  });
  afterAll(async () => {
    // Drops only this run's own solcacao_test_member1_<pid> database.
    if (isDatabaseReady()) await mongoose.connection.dropDatabase();
    await disconnectDb();
  });

  it('register -> login round trip with bcrypt (cost 12) and no hash or plaintext leakage', async () => {
    const created = await register(retail);
    expect(created.status).toBe(201);
    expect(created.body.data.user).toEqual({
      id: expect.stringMatching(/^[a-f0-9]{24}$/),
      name: 'Retail Tester',
      email: 'retail@member1.test',
      role: 'retail',
    });
    expect(created.body.data.token.split('.')).toHaveLength(3);
    const raw = JSON.stringify(created.body);
    expect(raw).not.toContain(PASSWORD);
    expect(raw).not.toMatch(/passwordHash|\$2[aby]\$|_id|__v|active/);

    const stored = await UserModel.findOne({ email: 'retail@member1.test' }).lean();
    expect(stored?.passwordHash).not.toBe(PASSWORD);
    expect(bcrypt.getRounds(stored?.passwordHash ?? '')).toBe(12);
    expect(await bcrypt.compare(PASSWORD, stored?.passwordHash ?? '')).toBe(true);

    const signedIn = await login('  RETAIL@member1.TEST ', PASSWORD);
    expect(signedIn.status).toBe(200);
    expect(signedIn.body.data.user).toEqual(created.body.data.user);
    const me = await as(signedIn.body.data.token).get('/api/auth/me');
    expect(me.body).toEqual({ data: created.body.data.user });
  });

  it('business registration creates the partner record and returns companyName', async () => {
    const created = await register(business);
    expect(created.status).toBe(201);
    expect(created.body.data.user).toMatchObject({ role: 'b2b', companyName: 'Test Co' });
    const partner = await CorporatePartnerModel.findOne({
      userId: created.body.data.user.id,
    }).lean();
    expect(partner?.companyName).toBe('Test Co');
    const signedIn = await login(business.email, PASSWORD);
    expect(signedIn.body.data.user.companyName).toBe('Test Co');
  });

  it('removes the user again when the partner insert fails (no half-created business)', async () => {
    const spy = vi
      .spyOn(CorporatePartnerModel, 'create')
      .mockRejectedValueOnce(new Error('simulated partner failure'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await register(business);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
    });
    expect(await UserModel.countDocuments({ email: business.email })).toBe(0);
    spy.mockRestore();
    consoleError.mockRestore();
    expect((await register(business)).status).toBe(201);
  });

  it('duplicate email -> 409 EMAIL_EXISTS', async () => {
    await register(retail);
    const again = await register({ ...retail, email: ' retail@MEMBER1.test ' });
    expect(again.status).toBe(409);
    expect(again.body.error).toMatchObject({
      code: 'EMAIL_EXISTS',
      fieldErrors: { email: expect.any(String) },
    });
  });

  it('concurrent same-email registration yields one account and one conflict', async () => {
    const results = await Promise.all([register(retail), register({ ...retail, name: 'Twin' })]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await UserModel.countDocuments({ email: 'retail@member1.test' })).toBe(1);
  });

  it('wrong password and unknown email fail identically (no enumeration)', async () => {
    await register(retail);
    const wrong = await login(retail.email, 'wrong-password-1');
    const unknown = await login('nobody@member1.test', PASSWORD);
    const tooLong = await login(retail.email, PASSWORD + 'x'.repeat(80));
    for (const response of [wrong, unknown, tooLong]) {
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
      });
    }
  });

  it('an inactive or deleted account can no longer sign in or use its token', async () => {
    const created = await register(retail);
    await UserModel.updateOne({ _id: created.body.data.user.id }, { active: false });
    expect((await login(retail.email, PASSWORD)).status).toBe(401);
    expect((await as(created.body.data.token).get('/api/auth/me')).status).toBe(401);
  });

  it('profile update changes name (and company for business) but never role or email', async () => {
    const r = (await register(retail)).body.data;
    const renamed = await as(r.token).patch('/api/users/me', { name: 'Renamed' });
    expect(renamed.body.data).toEqual({ ...r.user, name: 'Renamed' });
    const company = await as(r.token).patch('/api/users/me', { name: 'R', companyName: 'Co' });
    expect(company.status).toBe(400);

    const b = (await register(business)).body.data;
    const moved = await as(b.token).patch('/api/users/me', { name: 'B', companyName: 'New Co' });
    expect(moved.body.data).toMatchObject({ name: 'B', companyName: 'New Co', role: 'b2b' });
    const stored = await UserModel.findById(b.user.id).lean();
    expect(stored).toMatchObject({ role: 'b2b', email: 'buyer@member1.test' });
  });

  it('two users cannot read or write each other’s addresses', async () => {
    const a = (await register(retail)).body.data;
    const b = (await register(business)).body.data;

    const created = await as(a.token).post('/api/users/me/addresses', address);
    expect(created.status).toBe(200);
    expect(created.body.data).toEqual({ ...address, id: expect.stringMatching(/^[a-f0-9]{24}$/) });
    const id = created.body.data.id;

    const edited = await as(a.token).post('/api/users/me/addresses', {
      ...address,
      id,
      line2: 'Suite 5',
      city: 'Newtown',
    });
    expect(edited.body.data).toEqual({ ...address, id, line2: 'Suite 5', city: 'Newtown' });

    expect((await as(b.token).get('/api/users/me/addresses')).body.data).toEqual([]);
    const hijack = await as(b.token).post('/api/users/me/addresses', { ...address, id, city: 'X' });
    expect(hijack.status).toBe(404);
    expect(hijack.body.error.code).toBe('NOT_FOUND');

    const cleared = await as(a.token).post('/api/users/me/addresses', { ...address, id });
    expect(cleared.body.data.line2).toBeUndefined();
    const own = await as(a.token).get('/api/users/me/addresses');
    expect(own.body.data).toEqual([{ ...address, id }]);
    const stored = await AddressModel.findById(id).lean();
    expect(stored?.userId.toString()).toBe(a.user.id);
  });

  it('caps saved addresses at 20 per user', async () => {
    const a = (await register(retail)).body.data;
    for (let i = 0; i < 20; i++)
      expect((await as(a.token).post('/api/users/me/addresses', address)).status).toBe(200);
    const extra = await as(a.token).post('/api/users/me/addresses', address);
    expect(extra.status).toBe(400);
    expect(extra.body.error.fieldErrors).toEqual({ addresses: 'Maximum 20 addresses' });
  });
});
