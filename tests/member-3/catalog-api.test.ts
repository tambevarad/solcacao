import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../../server/src/app.js';
import { SHOPPER_A, checkoutInput, createCatalogTestApp } from './catalog-test-app.js';

// Route behavior that never reaches MongoDB: validation, authentication order, fail-closed
// mounting and the 503 path. Persistence is covered in persistence.test.ts against a real Mongo.
const offline = createCatalogTestApp({ isDatabaseReady: () => false });

describe('GET /api/products validation (before any database access)', () => {
  it.each([
    ['unknown key', 'colour=brown', 'colour'],
    ['operator injection in a key', 'origin[$ne]=Peru', 'origin[$ne]'],
    ['repeated key', 'origin=Peru&origin=Ghana', 'origin'],
    ['non-integer number', 'page=1.5', 'page'],
    ['negative number', 'priceMinCents=-1', 'priceMinCents'],
    ['limit above 48', 'limit=49', 'limit'],
    ['cacao above 100', 'cacaoMax=101', 'cacaoMax'],
    ['exact cacao with a range', 'cacaoPct=70&cacaoMin=60', 'cacaoPct'],
    ['min above max', 'priceMinCents=900&priceMaxCents=100', 'priceMinCents'],
    ['unknown category', 'category=cake', 'category'],
    ['unknown sort', 'sort=random', 'sort'],
    ['unsupported locale', 'locale=fr', 'locale'],
    ['search over 100 characters', `search=${'a'.repeat(101)}`, 'search'],
  ])('rejects %s with 400 VALIDATION_ERROR', async (_label, query, field) => {
    const response = await request(offline).get(`/api/products?${query}`);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.fieldErrors).toHaveProperty([field]);
  });

  it('returns 503 SERVICE_UNAVAILABLE for a valid query while the database is down', async () => {
    const response = await request(offline).get('/api/products?search=bar&cacaoMin=60&page=2');
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable' },
    });
  });

  it('answers a malformed slug with 404 without touching the database', async () => {
    const response = await request(offline).get('/api/products/Not%20A%20Slug');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

describe('cart routes', () => {
  it.each([
    ['get', '/api/cart'],
    ['post', '/api/cart/persist'],
    ['post', '/api/cart/merge'],
  ] as const)('%s %s requires authentication (401) before anything else', async (method, path) => {
    const response = await request(offline)[method](path).send([]);
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it.each([
    ['missing', undefined],
    ['unquoted', '3'],
    ['negative', '"-1"'],
    ['weak validator', 'W/"3"'],
    ['not a number', '"abc"'],
    ['wildcard', '*'],
  ])('rejects a %s If-Match revision with 400', async (_label, header) => {
    let call = request(offline).post('/api/cart/persist').set('x-test-user', SHOPPER_A);
    if (header !== undefined) call = call.set('If-Match', header);
    const response = await call.send([]);
    expect(response.status).toBe(400);
    expect(response.body.error.fieldErrors).toHaveProperty(['If-Match']);
  });

  it.each([
    ['an object instead of the raw array', { items: [] }, 'items'],
    [
      'a quantity of 0',
      [{ productId: '5c0ca0000000000000000001', quantity: 0 }],
      'items.0.quantity',
    ],
    [
      'a quantity of 100',
      [{ productId: '5c0ca0000000000000000001', quantity: 100 }],
      'items.0.quantity',
    ],
    [
      'a fractional quantity',
      [{ productId: '5c0ca0000000000000000001', quantity: 1.5 }],
      'items.0.quantity',
    ],
    ['a malformed id', [{ productId: 'abc', quantity: 1 }], 'items.0.productId'],
    ['an operator id', [{ productId: { $gt: '' }, quantity: 1 }], 'items.0.productId'],
    [
      'an untrusted price',
      [{ productId: '5c0ca0000000000000000001', quantity: 1, priceCents: 1 }],
      'items.0.priceCents',
    ],
    [
      'a userId field',
      [{ productId: '5c0ca0000000000000000001', quantity: 1, userId: SHOPPER_A }],
      'items.0.userId',
    ],
    [
      'duplicate ids',
      [
        { productId: '5c0ca0000000000000000001', quantity: 1 },
        { productId: '5C0CA0000000000000000001', quantity: 2 },
      ],
      'items.1.productId',
    ],
    [
      '51 distinct products',
      Array.from({ length: 51 }, (_, i) => ({
        productId: (i + 1).toString(16).padStart(24, '0'),
        quantity: 1,
      })),
      'items',
    ],
  ])('rejects a persist body with %s (400)', async (_label, body, field) => {
    const response = await request(offline)
      .post('/api/cart/persist')
      .set('x-test-user', SHOPPER_A)
      .set('If-Match', '"0"')
      .send(body);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.fieldErrors).toHaveProperty([field]);
  });

  it('validates merge input strictly (uuid mergeId, no extra fields)', async () => {
    const response = await request(offline)
      .post('/api/cart/merge')
      .set('x-test-user', SHOPPER_A)
      .send({ items: [], mergeId: 'not-a-uuid', userId: SHOPPER_A });
    expect(response.status).toBe(400);
    expect(response.body.error.fieldErrors).toMatchObject({
      mergeId: expect.any(String),
      userId: 'Unexpected field',
    });
  });

  it('reaches the 503 path only after auth and validation pass', async () => {
    const response = await request(offline)
      .post('/api/cart/persist')
      .set('x-test-user', SHOPPER_A)
      .set('If-Match', '"0"')
      .send([{ productId: '5c0ca0000000000000000001', quantity: 2 }]);
    expect(response.status).toBe(503);
  });
});

describe('POST /api/orders validation', () => {
  it.each([
    ['an invalid email', checkoutInput({ email: 'not-an-email' }), 'email'],
    ['an empty cart', checkoutInput({ items: [] }), 'items'],
    ['a non-uuid requestId', checkoutInput({ requestId: 'retry-1' }), 'requestId'],
    [
      'a 3-letter country',
      { ...checkoutInput(), address: { ...checkoutInput().address, country: 'USA' } },
      'address.country',
    ],
    [
      'a missing city',
      { ...checkoutInput(), address: { ...checkoutInput().address, city: ' ' } },
      'address.city',
    ],
    [
      'an address id',
      { ...checkoutInput(), address: { ...checkoutInput().address, id: SHOPPER_A } },
      'address.id',
    ],
    ['a client total', { ...checkoutInput(), totalCents: 1 }, 'totalCents'],
    ['a userId in the body', { ...checkoutInput(), userId: SHOPPER_A }, 'userId'],
  ])('rejects %s with 400', async (_label, body, field) => {
    const response = await request(offline).post('/api/orders').send(body);
    expect(response.status).toBe(400);
    expect(response.body.error.fieldErrors).toHaveProperty([field]);
  });

  it('rejects an invalid supplied token instead of downgrading to a guest', async () => {
    const response = await request(offline)
      .post('/api/orders')
      .set('x-test-user', 'invalid')
      .send(checkoutInput());
    expect(response.status).toBe(401);
  });

  it('accepts international addresses without line2 and reaches the database step', async () => {
    const response = await request(offline)
      .post('/api/orders')
      .send({
        ...checkoutInput(),
        address: {
          recipient: 'Zoë Test',
          line1: 'Calle 1',
          city: 'Bogotá',
          region: 'DC',
          postalCode: '110111',
          country: 'co',
        },
      });
    expect(response.status).toBe(503);
  });
});

describe('mounted catalogRouter until Student 1 auth lands', () => {
  it('fails closed with 401 on every cart route', async () => {
    for (const [method, path] of [
      ['get', '/api/cart'],
      ['post', '/api/cart/persist'],
      ['post', '/api/cart/merge'],
    ] as const) {
      const response = await request(app)
        [method](path)
        .set('Authorization', 'Bearer mock:0000000000000000000000a1');
      expect(response.status, path).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    }
  });

  it('rejects checkout requests that carry any Authorization header', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer anything')
      .send(checkoutInput());
    expect(response.status).toBe(401);
  });

  it('serves the product routes (503 here because no database is connected in unit tests)', async () => {
    const response = await request(app).get('/api/products');
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });
});

describe('POST /api/orders throttle (security finding 6)', () => {
  it('gives one client 30 attempts per 15 minutes, then 429 RATE_LIMITED', async () => {
    const app = createCatalogTestApp({ isDatabaseReady: () => false });
    for (let i = 0; i < 30; i++) {
      const res = await request(app).post('/api/orders').send({});
      expect(res.status).toBe(400);
    }
    const limited = await request(app).post('/api/orders').send({});
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe('RATE_LIMITED');
    expect(limited.headers).toHaveProperty('ratelimit-policy');
  });
});
