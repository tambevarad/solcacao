import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CheckoutInput, Product } from '../../contracts/index.js';
import { makeFixtureProducts } from '../../contracts/fixtures.js';
import { ApiError, createHttpClient } from '../../client/src/api/http.js';
import {
  catalogFixtureId,
  makeCatalogFixtures,
} from '../../client/src/features/catalog/fixtures.js';
import { createHttpCatalog, productQueryString } from '../../client/src/features/catalog/http.js';
import { createMockCatalog } from '../../client/src/features/catalog/mock.js';
import { mergeLines } from '../../client/src/features/catalog/rules.js';
import { testAddress } from './catalog-test-app.js';

const unusedHttp = createHttpClient(() => null);
const fixtures = makeCatalogFixtures();
const bySlug = (slug: string) => fixtures.find((p) => p.slug === slug)!;
const USER = '0000000000000000000000a1';

function mock(token: string | null = null, products?: Product[]) {
  let current = token;
  const api = createMockCatalog(unusedHttp, {
    token: () => current,
    delayMs: 0,
    now: () => new Date('2026-10-26T12:00:00.000Z'),
    products,
  });
  return { api, signIn: (id = USER) => (current = `mock:${id}`), signOut: () => (current = null) };
}

const checkout = (overrides: Partial<CheckoutInput> = {}): CheckoutInput => ({
  items: [{ productId: bySlug('ecuador-72-dark-bar').id, quantity: 2 }],
  email: 'Shopper@Example.test',
  address: testAddress(),
  requestId: '22222222-2222-4222-8222-222222222222',
  ...overrides,
});

describe('catalog fixtures', () => {
  it('are fictional, bilingual, deterministic and cover the required cases', () => {
    expect(makeCatalogFixtures()).toEqual(makeCatalogFixtures());
    expect(new Set(fixtures.map((p) => p.id)).size).toBe(fixtures.length);
    expect(new Set(fixtures.map((p) => p.slug)).size).toBe(fixtures.length);
    for (const product of fixtures) {
      expect(product.id).toMatch(/^[a-f0-9]{24}$/);
      expect(product.name.en && product.name.es).toBeTruthy();
      expect(product.description.en).toMatch(/fictional/i);
      expect(product.images.length).toBeGreaterThanOrEqual(1);
      expect(product.images.length).toBeLessThanOrEqual(2);
      for (const image of product.images) {
        expect(image.url).toMatch(/^\/images\/products\/[a-z-]+\.webp$/);
        expect(image.alt.en && image.alt.es).toBeTruthy();
      }
      expect(Number.isInteger(product.priceCents)).toBe(true);
    }
    expect(new Set(fixtures.map((p) => p.category))).toEqual(
      new Set(['bar', 'truffle', 'seasonal']),
    );
    expect(fixtures.some((p) => !p.active)).toBe(true);
    expect(fixtures.some((p) => p.active && p.stock === 0)).toBe(true);
    expect(catalogFixtureId(0)).toBe('5c0ca0000000000000000001');
  });

  it('leave the shared makeFixtureProducts() output untouched for Member 4', () => {
    const shared = makeFixtureProducts();
    expect(shared).toHaveLength(8);
    expect(shared[0]).toMatchObject({ slug: 'fixture-bar-1', priceCents: 500, origin: 'Ecuador' });
    expect(shared[0].name.es).toBe('Producto de prueba 1');
  });
});

describe('catalog mock: list', () => {
  it('uses the contract defaults and returns only active products', async () => {
    const page = await mock().api.list({});
    expect(page).toMatchObject({ page: 1, limit: 12, total: 14, totalPages: 2 });
    expect(page.items).toHaveLength(12);
    expect(page.items.every((p) => p.active)).toBe(true);
  });

  it('intersects origin + cacao range + price range + search', async () => {
    const { api } = mock();
    const page = await api.list({
      origin: 'Peru',
      cacaoMin: 65,
      cacaoMax: 90,
      priceMinCents: 900,
      priceMaxCents: 2300,
      search: 'DARK',
      locale: 'en',
    });
    expect(page.items.map((p) => p.slug)).toEqual(['peru-85-dark-bar', 'walnut-dark-truffles']);
    expect(page.total).toBe(2);
  });

  it('searches the selected locale only, as a literal case-insensitive substring', async () => {
    const { api } = mock();
    expect((await api.list({ search: 'tableta', locale: 'es' })).total).toBeGreaterThan(0);
    expect((await api.list({ search: 'tableta', locale: 'en' })).total).toBe(0);
    expect((await api.list({ search: '.*', locale: 'en' })).total).toBe(0);
    expect((await api.list({ search: '   ', locale: 'en' })).total).toBe(14);
  });

  it('matches cacaoPct exactly and rejects combining it with a range', async () => {
    const { api } = mock();
    expect((await api.list({ cacaoPct: 72 })).items.map((p) => p.slug)).toEqual([
      'ecuador-72-dark-bar',
    ]);
    await expect(api.list({ cacaoPct: 72, cacaoMax: 80 })).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      fieldErrors: { cacaoPct: expect.any(String) },
    });
  });

  it('sorts by localized name or price with id as tie-breaker, stable across pages', async () => {
    const twins = makeCatalogFixtures()
      .slice(0, 3)
      .map((p, i) => ({
        ...p,
        id: (3 - i).toString(16).padStart(24, '0'),
        priceCents: 1000,
        name: { en: 'Same', es: 'Igual' },
      }));
    const { api } = mock(null, twins);
    const ids = (await api.list({ sort: 'priceAsc' })).items.map((p) => p.id);
    expect(ids).toEqual([...ids].sort());
    expect((await api.list({ sort: 'name' })).items.map((p) => p.id)).toEqual(ids);
    // priceDesc is the exact reverse of priceAsc, ties included (as the server's index scan).
    expect((await api.list({ sort: 'priceDesc' })).items.map((p) => p.id)).toEqual(
      [...ids].reverse(),
    );

    const all = mock();
    const es = await all.api.list({ sort: 'name', locale: 'es', limit: 48 });
    const names = es.items.map((p) => p.name.es);
    expect(names).toEqual(
      [...names].sort(new Intl.Collator('es', { sensitivity: 'base' }).compare),
    );
    const desc = (await all.api.list({ sort: 'priceDesc', limit: 48 })).items.map(
      (p) => p.priceCents,
    );
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    const first = await all.api.list({ sort: 'priceAsc', limit: 5, page: 1 });
    const second = await all.api.list({ sort: 'priceAsc', limit: 5, page: 2 });
    expect(new Set([...first.items, ...second.items].map((p) => p.id)).size).toBe(10);
  });

  it('returns an empty page (not an error) beyond the last page, and 0 pages for no results', async () => {
    const { api } = mock();
    expect(await api.list({ page: 99 })).toMatchObject({
      items: [],
      total: 14,
      totalPages: 2,
      page: 99,
    });
    expect(await api.list({ origin: 'Atlantis' })).toMatchObject({
      items: [],
      total: 0,
      totalPages: 0,
    });
  });

  it('get() finds active products by canonical slug only', async () => {
    const { api } = mock();
    expect((await api.get('peru-85-dark-bar')).name.es).toBe('Tableta oscura Perú 85 %');
    for (const slug of ['foil-heart-duo', 'missing', 'Peru-85-dark-bar', '../etc'])
      await expect(api.get(slug)).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });

  it('returns copies so a consumer cannot mutate the fixture state', async () => {
    const { api } = mock();
    const product = await api.get('peru-85-dark-bar');
    product.priceCents = 1;
    expect((await api.get('peru-85-dark-bar')).priceCents).toBe(999);
  });
});

describe('catalog mock: saved cart, persist and merge', () => {
  const bar = bySlug('ecuador-72-dark-bar').id;
  const eggs = bySlug('spring-chocolate-eggs').id; // 3 in stock
  const soldOut = bySlug('vietnam-78-coffee-bar').id;
  const inactive = bySlug('foil-heart-duo').id;

  it('rejects protected operations without a mock token or with a foreign token', async () => {
    const { api } = mock();
    await expect(api.cart()).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    await expect(mock('Bearer real-jwt').api.cart()).rejects.toMatchObject({ status: 401 });
  });

  it('starts at revision 0, increments once per persist and rejects a stale revision', async () => {
    const { api, signIn } = mock();
    signIn();
    expect(await api.cart()).toEqual({ items: [], revision: 0 });
    const first = await api.persist({
      items: [{ productId: bar, quantity: 2 }],
      expectedRevision: 0,
    });
    expect(first).toEqual({ items: [{ productId: bar, quantity: 2 }], revision: 1 });
    await expect(
      api.persist({ items: [{ productId: bar, quantity: 5 }], expectedRevision: 0 }),
    ).rejects.toMatchObject({ status: 409, code: 'CART_CONFLICT' });
    expect((await api.cart()).items).toEqual([{ productId: bar, quantity: 2 }]);
  });

  it('two competing persists with the same revision: exactly one wins', async () => {
    const { api, signIn } = mock();
    signIn();
    const results = await Promise.allSettled([
      api.persist({ items: [{ productId: bar, quantity: 1 }], expectedRevision: 0 }),
      api.persist({ items: [{ productId: bar, quantity: 9 }], expectedRevision: 0 }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
  });

  it('keys saved carts by user, so one shopper cannot see another cart', async () => {
    const { api, signIn } = mock();
    signIn(USER);
    await api.persist({ items: [{ productId: bar, quantity: 2 }], expectedRevision: 0 });
    signIn('0000000000000000000000b2');
    expect(await api.cart()).toEqual({ items: [], revision: 0 });
  });

  it('validates persisted lines against stock and availability', async () => {
    const { api, signIn } = mock();
    signIn();
    await expect(
      api.persist({ items: [{ productId: eggs, quantity: 4 }], expectedRevision: 0 }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'OUT_OF_STOCK',
      fieldErrors: { 'items.0.quantity': 'Only 3 available' },
    });
    await expect(
      api.persist({ items: [{ productId: inactive, quantity: 1 }], expectedRevision: 0 }),
    ).rejects.toMatchObject({
      status: 400,
      fieldErrors: { 'items.0.productId': expect.any(String) },
    });
  });

  it('merges additively, caps by stock, drops unavailable lines and applies a mergeId once', async () => {
    const { api, signIn } = mock();
    signIn();
    await api.persist({
      items: [
        { productId: bar, quantity: 2 },
        { productId: eggs, quantity: 2 },
      ],
      expectedRevision: 0,
    });
    const input = {
      items: [
        { productId: bar, quantity: 3 },
        { productId: eggs, quantity: 2 },
        { productId: soldOut, quantity: 1 },
        { productId: inactive, quantity: 1 },
      ],
      mergeId: '33333333-3333-4333-8333-333333333333',
    };
    const merged = await api.merge(input);
    expect(merged).toEqual({
      items: [
        { productId: bar, quantity: 5 },
        { productId: eggs, quantity: 3 },
      ],
      revision: 2,
    });
    // Retry after a lost response, and a concurrent duplicate: no extra quantity, same revision.
    const [again, concurrent] = await Promise.all([api.merge(input), api.merge(input)]);
    expect(again).toEqual(merged);
    expect(concurrent).toEqual(merged);
  });

  it('keeps only the latest 100 merge markers', async () => {
    const { api, signIn } = mock();
    signIn();
    const id = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
    for (let n = 0; n <= 100; n++)
      await api.merge({ items: [{ productId: bar, quantity: 1 }], mergeId: id(n) });
    const before = (await api.cart()).revision;
    // Within the horizon: a retry is a no-op.
    expect(
      (await api.merge({ items: [{ productId: bar, quantity: 1 }], mergeId: id(100) })).revision,
    ).toBe(before);
    // The oldest marker fell out of the 100-marker horizon, so a retry that old applies again.
    expect(
      (await api.merge({ items: [{ productId: bar, quantity: 1 }], mergeId: id(0) })).revision,
    ).toBe(before + 1);
  });
});

describe('mergeLines (shared by the mock and the server)', () => {
  it('sums, caps at min(99, stock), keeps untouched saved lines and never exceeds 50 lines', () => {
    const saved = [
      { productId: 'a', quantity: 98 },
      { productId: 'b', quantity: 1 },
    ];
    const guest = [
      { productId: 'a', quantity: 5 },
      { productId: 'c', quantity: 2 },
      { productId: 'gone', quantity: 1 },
    ];
    const stock: Record<string, number> = { a: 500, b: 5, c: 1 };
    expect(mergeLines(saved, guest, (id) => stock[id]).items).toEqual([
      { productId: 'a', quantity: 99 },
      { productId: 'b', quantity: 1 },
      { productId: 'c', quantity: 1 },
    ]);
    const full = Array.from({ length: 50 }, (_, i) => ({ productId: `p${i}`, quantity: 1 }));
    expect(mergeLines(full, [{ productId: 'extra', quantity: 1 }], () => 10).items).toHaveLength(
      50,
    );
  });
});

describe('catalog mock: simulated checkout', () => {
  it('recalculates the total from catalog prices and returns a simulated receipt', async () => {
    const receipt = await mock().api.checkout(checkout());
    expect(receipt).toEqual({
      id: '222222222222422282222222',
      status: 'simulated',
      totalCents: 2 * 899,
      currency: 'USD',
      createdAt: '2026-10-26T12:00:00.000Z',
    });
  });

  it('returns the original receipt for a retry and 409 for a reused requestId with a new body', async () => {
    const { api } = mock();
    const [a, b] = await Promise.all([api.checkout(checkout()), api.checkout(checkout())]);
    expect(b).toEqual(a);
    // Normalized email: case and whitespace do not make a different request.
    expect(await api.checkout(checkout({ email: '  shopper@example.TEST ' }))).toEqual(a);
    await expect(
      api.checkout(
        checkout({ items: [{ productId: bySlug('ecuador-72-dark-bar').id, quantity: 3 }] }),
      ),
    ).rejects.toMatchObject({ status: 409, code: 'IDEMPOTENCY_CONFLICT' });
  });

  it('rejects insufficient stock and unavailable products with 409 OUT_OF_STOCK', async () => {
    const { api } = mock();
    await expect(
      api.checkout(
        checkout({ items: [{ productId: bySlug('spring-chocolate-eggs').id, quantity: 4 }] }),
      ),
    ).rejects.toMatchObject({
      status: 409,
      code: 'OUT_OF_STOCK',
      fieldErrors: { 'items.0.quantity': 'Only 3 available' },
    });
    await expect(
      api.checkout(checkout({ items: [{ productId: bySlug('foil-heart-duo').id, quantity: 1 }] })),
    ).rejects.toMatchObject({ status: 409, code: 'OUT_OF_STOCK' });
  });

  it('rejects invalid input with field errors and an invalid supplied token with 401', async () => {
    await expect(
      mock().api.checkout(
        checkout({ email: 'nope', address: testAddress({ country: 'XX', postalCode: '' }) }),
      ),
    ).rejects.toMatchObject({
      status: 400,
      fieldErrors: {
        email: expect.any(String),
        'address.country': expect.any(String),
        'address.postalCode': 'Required',
      },
    });
    await expect(mock('mock:not-an-id').api.checkout(checkout())).rejects.toMatchObject({
      status: 401,
    });
  });

  it('does not deduct stock (orders are simulated)', async () => {
    const { api } = mock();
    await api.checkout(
      checkout({ items: [{ productId: bySlug('spring-chocolate-eggs').id, quantity: 3 }] }),
    );
    expect((await api.get('spring-chocolate-eggs')).stock).toBe(3);
  });
});

describe('catalog HTTP adapter', () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubFetch(body: unknown, init: ResponseInit = { status: 200 }) {
    const fetchMock = vi.fn(
      async (_url: string, _init: RequestInit) => new Response(JSON.stringify(body), init),
    );
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('encodes only defined query values, never the string "undefined"', () => {
    expect(productQueryString({})).toBe('');
    expect(
      productQueryString({
        search: ' dark & 70% ',
        origin: undefined,
        cacaoMin: 0,
        page: 2,
        locale: 'es',
      }),
    ).toBe('?search=dark+%26+70%25&cacaoMin=0&page=2&locale=es');
    expect(productQueryString({ search: '   ' })).toBe('');
  });

  it('reads the raw Product[] list and rebuilds ProductPage from pagination headers', async () => {
    const items = fixtures.slice(0, 2);
    const fetchMock = stubFetch(items, {
      status: 200,
      headers: { 'X-Page': '2', 'X-Limit': '2', 'X-Total-Count': '7', 'X-Total-Pages': '4' },
    });
    const page = await createHttpCatalog(createHttpClient(() => null)).list({
      limit: 2,
      page: 2,
      locale: 'en',
    });
    expect(page).toEqual({ items, page: 2, limit: 2, total: 7, totalPages: 4 });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/products?page=2&limit=2&locale=en');
  });

  it('gets a product by encoded slug and unwraps { data }', async () => {
    const fetchMock = stubFetch({ data: fixtures[0] });
    expect(
      await createHttpCatalog(createHttpClient(() => null)).get('ecuador-72-dark-bar'),
    ).toEqual(fixtures[0]);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/products/ecuador-72-dark-bar');
  });

  it('persists the raw items array with a quoted If-Match revision and the bearer token', async () => {
    const cart = { items: [{ productId: fixtures[0].id, quantity: 2 }], revision: 4 };
    const fetchMock = stubFetch({ data: cart });
    const result = await createHttpCatalog(createHttpClient(() => 'jwt-token')).persist({
      items: cart.items,
      expectedRevision: 3,
    });
    expect(result).toEqual(cart);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/cart/persist');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual(cart.items);
    const headers = new Headers(init.headers);
    expect(headers.get('If-Match')).toBe('"3"');
    expect(headers.get('Authorization')).toBe('Bearer jwt-token');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('posts merge and checkout bodies to their exact routes', async () => {
    const fetchMock = stubFetch({ data: { items: [], revision: 1 } });
    const api = createHttpCatalog(createHttpClient(() => null));
    await api.merge({ items: [], mergeId: '33333333-3333-4333-8333-333333333333' });
    await api.cart();
    await api.checkout(checkout());
    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method ?? 'GET'])).toEqual([
      ['/api/cart/merge', 'POST'],
      ['/api/cart', 'GET'],
      ['/api/orders', 'POST'],
    ]);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toEqual({
      items: [],
      mergeId: '33333333-3333-4333-8333-333333333333',
    });
  });

  it('surfaces error envelopes as ApiError (e.g. 409 CART_CONFLICT)', async () => {
    stubFetch({ error: { code: 'CART_CONFLICT', message: 'Changed' } }, { status: 409 });
    const error = await createHttpCatalog(createHttpClient(() => 't'))
      .persist({ items: [], expectedRevision: 0 })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: 'CART_CONFLICT' });
  });
});
