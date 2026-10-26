import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { makeCatalogFixtures } from '../../client/src/features/catalog/fixtures.js';
import {
  CartModel,
  InventoryModel,
  OrderModel,
  ProductModel,
} from '../../server/src/features/catalog/models.js';
import { seedCatalogFixtures } from '../../server/src/features/catalog/seed.js';
import { getActiveProductsByIds } from '../../server/src/features/catalog/service.js';
import { SHOPPER_A, SHOPPER_B, checkoutInput, createCatalogTestApp } from './catalog-test-app.js';

// Real MongoDB (docs/contracts.md: tests use an isolated TEST_MONGODB_URI, e.g. after
// `npm run services`: TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test_member3).
// Skipped, and reported as skipped, when it is not set. Never point it at a shared database:
// these tests delete the catalog collections they use.
const uri = process.env.TEST_MONGODB_URI ?? '';
const products = makeCatalogFixtures();
const id = (slug: string) => products.find((p) => p.slug === slug)!.id;
const BAR = id('ecuador-72-dark-bar'); // $8.99, 24 units
const EGGS = id('spring-chocolate-eggs'); // $12.00, 3 units
const SOLD_OUT = id('vietnam-78-coffee-bar');
const INACTIVE = id('foil-heart-duo');

describe.skipIf(!uri)('catalog persistence (real MongoDB)', () => {
  const app = createCatalogTestApp();
  const persist = (user: string, revision: string, body: unknown) =>
    request(app)
      .post('/api/cart/persist')
      .set('x-test-user', user)
      .set('If-Match', revision)
      .send(body);
  const merge = (user: string, body: unknown) =>
    request(app).post('/api/cart/merge').set('x-test-user', user).send(body);

  beforeAll(async () => {
    await mongoose.connect(uri);
    await Promise.all([
      ProductModel.init(),
      InventoryModel.init(),
      CartModel.init(),
      OrderModel.init(),
    ]);
  });
  beforeEach(async () => {
    await Promise.all([
      ProductModel.deleteMany({}),
      InventoryModel.deleteMany({}),
      CartModel.deleteMany({}),
      OrderModel.deleteMany({}),
    ]);
    await seedCatalogFixtures();
  });
  afterAll(async () => {
    await Promise.all([
      ProductModel.deleteMany({}),
      InventoryModel.deleteMany({}),
      CartModel.deleteMany({}),
      OrderModel.deleteMany({}),
    ]);
    await mongoose.disconnect();
  });

  describe('products', () => {
    it('seeds idempotently without deleting anything', async () => {
      await seedCatalogFixtures();
      expect(await ProductModel.countDocuments()).toBe(products.length);
      expect(await InventoryModel.countDocuments()).toBe(products.length);
    });

    it('returns a raw Product[] with pagination headers and active products only', async () => {
      const response = await request(app).get('/api/products?limit=5&page=3');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.headers).toMatchObject({
        'x-page': '3',
        'x-limit': '5',
        'x-total-count': '14',
        'x-total-pages': '3',
      });
      expect(response.body).toHaveLength(4);
      for (const product of response.body) {
        expect(Object.keys(product).sort()).toEqual(Object.keys(products[0]).sort());
        expect(product.active).toBe(true);
      }
    });

    it('intersects origin + cacao + price + search with identical count and items', async () => {
      const response = await request(app).get(
        '/api/products?origin=Peru&cacaoMin=65&cacaoMax=90&priceMinCents=900&priceMaxCents=2300&search=DARK',
      );
      expect(response.body.map((p: { slug: string }) => p.slug)).toEqual([
        'peru-85-dark-bar',
        'walnut-dark-truffles',
      ]);
      expect(response.headers['x-total-count']).toBe('2');
    });

    it('searches the chosen locale literally and ignores regex syntax', async () => {
      const es = await request(app).get('/api/products?search=tableta&locale=es');
      expect(Number(es.headers['x-total-count'])).toBeGreaterThan(0);
      const en = await request(app).get('/api/products?search=tableta&locale=en');
      expect(en.body).toEqual([]);
      const regex = await request(app).get(`/api/products?search=${encodeURIComponent('.*')}`);
      expect(regex.body).toEqual([]);
      expect(regex.headers['x-total-pages']).toBe('0');
    });

    it('sorts by localized name and price with _id as the tie-breaker', async () => {
      await ProductModel.updateMany({}, { $set: { priceCents: 1000 } });
      const tied = await request(app).get('/api/products?sort=priceAsc&limit=48');
      const ids = tied.body.map((p: { id: string }) => p.id);
      expect(ids).toEqual([...ids].sort());
      const es = await request(app).get('/api/products?sort=name&locale=es&limit=48');
      const names = es.body.map((p: { name: { es: string } }) => p.name.es);
      expect(names).toEqual(
        [...names].sort(new Intl.Collator('es', { sensitivity: 'base' }).compare),
      );
    });

    it('returns an empty page beyond the last page', async () => {
      const response = await request(app).get('/api/products?page=50');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(response.headers['x-total-count']).toBe('14');
    });

    it('serves an active product by slug with inventory stock; inactive and missing are 404', async () => {
      const found = await request(app).get('/api/products/spring-chocolate-eggs');
      expect(found.status).toBe(200);
      expect(found.body.data).toEqual(products.find((p) => p.slug === 'spring-chocolate-eggs'));
      await InventoryModel.updateOne({ productId: EGGS }, { availableUnits: 1 });
      expect((await request(app).get('/api/products/spring-chocolate-eggs')).body.data.stock).toBe(
        1,
      );
      for (const slug of ['foil-heart-duo', 'nope'])
        expect((await request(app).get(`/api/products/${slug}`)).status).toBe(404);
    });

    it('getActiveProductsByIds dedupes, keeps order and excludes missing, inactive and malformed ids', async () => {
      const result = await getActiveProductsByIds([
        EGGS,
        BAR,
        EGGS.toUpperCase(),
        INACTIVE,
        '0'.repeat(24),
        'bad',
      ]);
      expect(result.map((p) => p.id)).toEqual([EGGS, BAR]);
      expect(result[0].stock).toBe(3);
    });
  });

  describe('carts', () => {
    it('starts at revision 0 and persists with an atomic revision check', async () => {
      expect((await request(app).get('/api/cart').set('x-test-user', SHOPPER_A)).body.data).toEqual(
        {
          items: [],
          revision: 0,
        },
      );
      const first = await persist(SHOPPER_A, '"0"', [{ productId: BAR, quantity: 2 }]);
      expect(first.status).toBe(200);
      expect(first.body.data).toEqual({ items: [{ productId: BAR, quantity: 2 }], revision: 1 });
      const stale = await persist(SHOPPER_A, '"0"', [{ productId: BAR, quantity: 9 }]);
      expect(stale.status).toBe(409);
      expect(stale.body.error.code).toBe('CART_CONFLICT');
    });

    it('lets only one of two competing persists win the same revision (including the first save)', async () => {
      for (const revision of ['"0"', '"1"']) {
        const results = await Promise.all([
          persist(SHOPPER_A, revision, [{ productId: BAR, quantity: 1 }]),
          persist(SHOPPER_A, revision, [{ productId: BAR, quantity: 3 }]),
        ]);
        expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
      }
      expect(await CartModel.countDocuments({ userId: SHOPPER_A })).toBe(1);
      expect((await CartModel.findOne({ userId: SHOPPER_A }).lean())?.revision).toBe(2);
    });

    it('validates persisted quantities against stock and availability', async () => {
      const short = await persist(SHOPPER_A, '"0"', [{ productId: EGGS, quantity: 4 }]);
      expect(short.status).toBe(409);
      expect(short.body.error).toMatchObject({
        code: 'OUT_OF_STOCK',
        fieldErrors: { 'items.0.quantity': 'Only 3 available' },
      });
      expect((await persist(SHOPPER_A, '"0"', [{ productId: INACTIVE, quantity: 1 }])).status).toBe(
        400,
      );
    });

    it('scopes every cart to its owner', async () => {
      await persist(SHOPPER_A, '"0"', [{ productId: BAR, quantity: 2 }]);
      expect(
        (await request(app).get('/api/cart').set('x-test-user', SHOPPER_B)).body.data.items,
      ).toEqual([]);
      expect((await persist(SHOPPER_B, '"1"', [])).status).toBe(409);
      expect((await CartModel.findOne({ userId: SHOPPER_A }).lean())?.items).toHaveLength(1);
    });

    it('rejects raw Mongo operators in the body', async () => {
      const response = await persist(SHOPPER_A, '"0"', [{ productId: { $ne: null }, quantity: 1 }]);
      expect(response.status).toBe(400);
      expect(await CartModel.countDocuments()).toBe(0);
    });

    it('merges additively with caps, drops unavailable lines and keeps other saved lines', async () => {
      await persist(SHOPPER_A, '"0"', [
        { productId: BAR, quantity: 20 },
        { productId: EGGS, quantity: 2 },
      ]);
      const response = await merge(SHOPPER_A, {
        items: [
          { productId: BAR, quantity: 10 },
          { productId: EGGS, quantity: 5 },
          { productId: SOLD_OUT, quantity: 1 },
          { productId: INACTIVE, quantity: 1 },
        ],
        mergeId: '44444444-4444-4444-8444-444444444444',
      });
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({
        items: [
          { productId: BAR, quantity: 24 },
          { productId: EGGS, quantity: 3 },
        ],
        revision: 2,
      });
    });

    it('applies the same mergeId once: lost-response retry and concurrent duplicates', async () => {
      const input = {
        items: [{ productId: BAR, quantity: 2 }],
        mergeId: '55555555-5555-4555-8555-555555555555',
      };
      const concurrent = await Promise.all([
        merge(SHOPPER_A, input),
        merge(SHOPPER_A, input),
        merge(SHOPPER_A, input),
      ]);
      expect(concurrent.map((r) => r.status)).toEqual([200, 200, 200]);
      const retry = await merge(SHOPPER_A, input);
      expect(retry.body.data).toEqual({ items: [{ productId: BAR, quantity: 2 }], revision: 1 });
      const stored = await CartModel.findOne({ userId: SHOPPER_A }).lean();
      expect(stored?.mergeIds).toEqual([input.mergeId]);
      expect(await CartModel.countDocuments({ userId: SHOPPER_A })).toBe(1);
    });

    it('keeps only the latest 100 merge markers in the cart document', async () => {
      for (let n = 0; n < 101; n++)
        await merge(SHOPPER_A, {
          items: [],
          mergeId: `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`,
        });
      const stored = await CartModel.findOne({ userId: SHOPPER_A }).lean();
      expect(stored?.mergeIds).toHaveLength(100);
      expect(stored?.mergeIds[0]).toBe('00000000-0000-4000-8000-000000000001');
      expect(stored?.revision).toBe(101);
    });
  });

  describe('orders', () => {
    it('stores authoritative totals and snapshots, status simulated, without deducting stock', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send(
          checkoutInput({
            items: [
              { productId: BAR, quantity: 2 },
              { productId: EGGS, quantity: 3 },
            ],
          }),
        );
      expect(response.status).toBe(201);
      const receipt = response.body.data;
      expect(receipt).toMatchObject({
        status: 'simulated',
        totalCents: 2 * 899 + 3 * 1200,
        currency: 'USD',
      });
      expect(Object.keys(receipt).sort()).toEqual([
        'createdAt',
        'currency',
        'id',
        'status',
        'totalCents',
      ]);
      const order = await OrderModel.findById(receipt.id).lean();
      expect(order?.userId).toBeNull();
      expect(order?.items).toEqual([
        {
          productId: new mongoose.Types.ObjectId(BAR),
          name: products[0].name,
          unitPriceCents: 899,
          quantity: 2,
        },
        expect.objectContaining({ unitPriceCents: 1200, quantity: 3 }),
      ]);
      expect((await InventoryModel.findOne({ productId: EGGS }).lean())?.availableUnits).toBe(3);
    });

    it('derives the owner from the verified user, never the body', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('x-test-user', SHOPPER_A)
        .send(checkoutInput());
      expect(response.status).toBe(201);
      expect((await OrderModel.findById(response.body.data.id).lean())?.userId?.toString()).toBe(
        SHOPPER_A,
      );
    });

    it('rejects insufficient stock with 409 OUT_OF_STOCK and stores nothing', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send(checkoutInput({ items: [{ productId: EGGS, quantity: 4 }] }));
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('OUT_OF_STOCK');
      expect(await OrderModel.countDocuments()).toBe(0);
    });

    it('turns retries and concurrent duplicates into one order; a changed body conflicts', async () => {
      const body = checkoutInput();
      const [a, b] = await Promise.all([
        request(app).post('/api/orders').send(body),
        request(app).post('/api/orders').send(body),
      ]);
      expect([a.status, b.status]).toEqual([201, 201]);
      expect(b.body.data).toEqual(a.body.data);
      const retry = await request(app)
        .post('/api/orders')
        .send({ ...body, email: ' SHOPPER@example.test ' });
      expect(retry.body.data).toEqual(a.body.data);
      expect(await OrderModel.countDocuments()).toBe(1);

      const changed = await request(app)
        .post('/api/orders')
        .send({ ...body, items: [{ productId: BAR, quantity: 3 }] });
      expect(changed.status).toBe(409);
      expect(changed.body.error.code).toBe('IDEMPOTENCY_CONFLICT');
      const otherOwner = await request(app)
        .post('/api/orders')
        .set('x-test-user', SHOPPER_B)
        .send(body);
      expect(otherOwner.status).toBe(409);
    });

    it('uses the current database price, not anything the client could send', async () => {
      await ProductModel.updateOne({ _id: BAR }, { priceCents: 1234 });
      const response = await request(app)
        .post('/api/orders')
        .send(checkoutInput({ items: [{ productId: BAR, quantity: 1 }] }));
      expect(response.body.data.totalCents).toBe(1234);
    });
  });
});
