import {
  expect,
  request as apiRequest,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';
import mongoose from 'mongoose';

// Student 3 Phase 3 retail journeys against the live API and a real, seeded MongoDB
// (tests/member-3/playwright.config.ts). Every step waits for the real /api response it depends
// on, and saved carts, orders and stock are read back from the API or the database, so none of
// this can pass against mock adapters. Accounts are synthetic (.test addresses).

test.describe.configure({ mode: 'serial' }); // Later journeys reuse the accounts' saved carts.

const BASE = process.env.LIVE_BASE_URL ?? 'http://127.0.0.1:4000';
// The database the API uses. Defaults to the local e2e database for a local API; for the deployed
// site (no database access) leave it unset: database read-backs are skipped, and so is the
// stale-stock journey, which must change stock. LIVE_MONGODB_URI=none also turns them off.
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(BASE);
const DB =
  process.env.LIVE_MONGODB_URI === 'none'
    ? ''
    : (process.env.LIVE_MONGODB_URI ?? (isLocal ? 'mongodb://127.0.0.1:27017/solcacao_e2e' : ''));
const hasDb = DB !== '';
const PASSWORD = 'live-retail-password-123';
const GUEST_KEY = 'solcacao.guestCart.v1';

interface Product {
  id: string;
  slug: string;
  name: { en: string; es: string };
  priceCents: number;
  stock: number;
  images: { url: string; alt: { en: string; es: string } }[];
}
interface Account {
  email: string;
  token: string;
  id: string;
}

const unique = () => `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
const usd = (cents: number, locale = 'en') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(cents / 100);
const apiResponse = (page: Page, method: string, path: string) =>
  page.waitForResponse(
    (r) => r.request().method() === method && new URL(r.url()).pathname === path,
  );
/** The product-list response whose query has key=value (earlier list requests are ignored). */
const productsWith = (page: Page, key: string, value: string) =>
  page.waitForResponse((r) => {
    const url = new URL(r.url());
    return url.pathname === '/api/products' && url.searchParams.get(key) === value;
  });
const cartButton = (page: Page) =>
  page.getByRole('banner').getByRole('button', { name: /^(Open cart|Abrir carrito)/ });
const expectCount = (page: Page, count: number) =>
  expect(cartButton(page)).toHaveAccessibleName(
    new RegExp(`(Open cart\\. Items|Abrir carrito\\. Artículos): ${count}$`),
  );
const guestCart = (page: Page) =>
  page.evaluate((key) => window.localStorage.getItem(key), GUEST_KEY);

let api: APIRequestContext;
let db: mongoose.Connection;
let products: Map<string, Product>;
const accounts: Record<'merge' | 'retry' | 'other', Account> = {
  merge: { email: '', token: '', id: '' },
  retry: { email: '', token: '', id: '' },
  other: { email: '', token: '', id: '' },
};
const product = (slug: string) => products.get(slug)!;

async function register(role: keyof typeof accounts) {
  const email = `retail-${role}-${unique()}@example.test`;
  const response = await api.post('/api/auth/register', {
    data: { name: 'Live Retail Shopper', email, password: PASSWORD, role: 'retail' },
  });
  expect(response.status()).toBe(201);
  const token = (await response.json()).data.token as string;
  const id = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).sub as string;
  accounts[role] = { email, token, id };
}

const auth = (account: Account) => ({ Authorization: `Bearer ${account.token}` });
async function savedCart(account: Account) {
  const response = await api.get('/api/cart', { headers: auth(account) });
  expect(response.status()).toBe(200);
  return (await response.json()).data as {
    items: { productId: string; quantity: number }[];
    revision: number;
  };
}
async function persistAs(account: Account, revision: number, items: unknown) {
  return api.post('/api/cart/persist', {
    headers: { ...auth(account), 'If-Match': `"${revision}"` },
    data: items,
  });
}

/** Full page load to the sign-in page (the guest cart stays in localStorage), then sign in. */
async function signIn(page: Page, account: Account) {
  await page.goto('/en/login');
  await page.getByLabel(/^email/i).fill(account.email);
  await page.getByLabel(/^password/i).fill(PASSWORD);
  const login = apiResponse(page, 'POST', '/api/auth/login');
  await page
    .getByRole('main')
    .getByRole('button', { name: /^sign in$/i })
    .click();
  expect((await login).status()).toBe(200);
  await expect(page).toHaveURL(/\/en\/account$/);
}

/**
 * In-app navigation. The session token lives in memory, so page.goto would sign the shopper out;
 * this moves the router like a link click does.
 */
async function inApp(page: Page, path: string) {
  await page.evaluate((to) => {
    window.history.pushState({}, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
  await expect(page).toHaveURL(new RegExp(`${path.replace(/[?]/g, '\\?')}$`));
}

async function addFromProductPage(page: Page, quantity: number) {
  const field = page.getByRole('main').getByRole('spinbutton', { name: /^(Quantity|Cantidad)/ });
  await field.fill(String(quantity));
  await page
    .getByRole('main')
    .getByRole('button', { name: /^(Add to cart|Añadir al carrito)$/ })
    .click();
}

const fillAddress = async (page: Page, email: string) => {
  await page.getByLabel(/^email/i).fill(email);
  await page.getByLabel(/^full name/i).fill('Live Retail Shopper');
  await page.getByLabel(/^address line 1/i).fill('1 Cacao Lane');
  await page.getByLabel(/^city/i).fill('Austin');
  await page.getByLabel(/^state, province or region/i).fill('TX');
  await page.getByLabel(/^postal code/i).fill('78701');
};

test.beforeAll(async () => {
  api = await apiRequest.newContext({ baseURL: BASE });
  if (hasDb) db = await mongoose.createConnection(DB).asPromise();
  const list = await api.get('/api/products?limit=48');
  expect(list.status()).toBe(200);
  products = new Map(((await list.json()) as Product[]).map((p) => [p.slug, p]));
  expect(products.size).toBeGreaterThan(0);
  // Registration is limited to 10 per hour per address; these journeys need three accounts.
  await register('merge');
  await register('retry');
  await register('other');
});
test.afterAll(async () => {
  await api.dispose();
  if (hasDb) await db.close();
});

// No console errors in any journey. A refused request (an intended 409, or a request this test
// aborts on purpose) is logged by the browser as "Failed to load resource", which is expected.
let consoleErrors: string[] = [];
test.beforeEach(({ page }) => {
  consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !/Failed to load resource/.test(message.text()))
      consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
});
test.afterEach(() => expect(consoleErrors).toEqual([]));

test('filters, sort and the product page come from the live API, with no fixture fallback', async ({
  page,
}) => {
  const first = apiResponse(page, 'GET', '/api/products');
  await page.goto('/en/catalog');
  const listed = (await (await first).json()) as Product[];
  const results = page.getByRole('region', { name: 'Results' });
  await expect(results.getByRole('heading', { level: 2 }).nth(1)).toHaveText(listed[0].name.en);

  let response = productsWith(page, 'category', 'bar');
  await page.getByLabel('Collection').first().selectOption('bar');
  expect((await response).status()).toBe(200);
  response = productsWith(page, 'origin', 'Peru');
  await page.getByLabel('Origin').first().selectOption('Peru');
  const filtered = await response;
  expect(new URL(filtered.url()).searchParams.get('category')).toBe('bar');
  const total = filtered.headers()['x-total-count'];
  await expect(page.getByText(`${total} chocolates`)).toBeVisible();

  response = productsWith(page, 'sort', 'priceDesc');
  await page.getByLabel('Sort by').selectOption('priceDesc');
  const sorted = (await (await response).json()) as Product[];
  expect(sorted.length).toBe(Number(total));
  expect(sorted.map((p) => p.priceCents)).toEqual(
    [...sorted.map((p) => p.priceCents)].sort((a, b) => b - a),
  );
  await expect(page).toHaveURL(/\/en\/catalog\?.*sort=priceDesc/);
  await expect(page).toHaveURL(/category=bar/);
  await expect(page).toHaveURL(/origin=Peru/);

  const detail = apiResponse(page, 'GET', `/api/products/${sorted[0].slug}`);
  await results.getByRole('link', { name: sorted[0].name.en }).click();
  expect((await detail).status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(sorted[0].name.en);
  await expect(page.getByText(usd(sorted[0].priceCents), { exact: true })).toBeVisible();

  // A failed request shows the error state; there is no silent fallback to fixtures.
  await page.route('**/api/products?**', (route) => route.abort());
  await page.goto('/en/catalog?origin=Ghana');
  await expect(page.getByText('Chocolates could not be loaded')).toBeVisible();
  await page.unroute('**/api/products?**');
});

test('a guest cart adds quantities at live prices and survives a reload', async ({ page }) => {
  const peru = product('peru-85-dark-bar');
  await page.goto(`/en/products/${peru.slug}`);
  await addFromProductPage(page, 2);
  await expectCount(page, 2);
  await page.reload();
  await expectCount(page, 2);

  await page.goto('/en/catalog');
  const results = page.getByRole('region', { name: 'Results' });
  await results
    .getByRole('spinbutton', { name: `Quantity of ${peru.name.en}`, exact: true })
    .fill('1');
  await results.getByRole('button', { name: `Add to cart: ${peru.name.en}` }).click();
  await expectCount(page, 3);
  await cartButton(page).click();
  const drawer = page.getByRole('dialog', { name: 'Your cart' });
  await expect(drawer.getByTestId('cart-subtotal')).toHaveText(usd(3 * peru.priceCents));
  expect(JSON.parse((await guestCart(page))!).items).toEqual([{ productId: peru.id, quantity: 3 }]);
});

test('sign-in merges the guest cart once, capped by stock, and saves it in MongoDB', async ({
  page,
}) => {
  const eggs = product('spring-chocolate-eggs');
  const peru = product('peru-85-dark-bar');
  expect(eggs.stock).toBe(3);
  // Saved cart from an earlier visit: 2 eggs.
  expect((await persistAs(accounts.merge, 0, [{ productId: eggs.id, quantity: 2 }])).status()).toBe(
    200,
  );

  await page.goto(`/en/products/${eggs.slug}`);
  await addFromProductPage(page, 3);
  await page.goto(`/en/products/${peru.slug}`);
  await addFromProductPage(page, 1);
  await expectCount(page, 4);

  const merge = apiResponse(page, 'POST', '/api/cart/merge');
  await signIn(page, accounts.merge);
  expect((await merge).status()).toBe(200);
  // The merge result floats over the page while the drawer is closed (added in PR for D22 turn 3).
  // A deployment from before that change shows it only inside the drawer: set
  // LIVE_EXPECT_FLOATING_NOTICE=0 there to read it from the drawer instead.
  if (process.env.LIVE_EXPECT_FLOATING_NOTICE === '0') await cartButton(page).click();
  const notice = page.getByRole('alert').filter({ hasText: 'Some quantities changed' });
  await expect(notice).toContainText(`${eggs.name.en}: 3 instead of 5 (limited by stock)`);
  if (process.env.LIVE_EXPECT_FLOATING_NOTICE === '0') await page.keyboard.press('Escape');
  await expectCount(page, 4);
  expect(await guestCart(page)).toBeNull();

  const saved = await savedCart(accounts.merge);
  expect(saved.items).toEqual(
    expect.arrayContaining([
      { productId: eggs.id, quantity: 3 },
      { productId: peru.id, quantity: 1 },
    ]),
  );
  expect(saved.items).toHaveLength(2);
  expect(saved.revision).toBe(2);
  if (!hasDb) return;
  const stored = await db
    .collection('carts')
    .findOne({ userId: new mongoose.Types.ObjectId(accounts.merge.id) });
  expect(stored?.mergeIds).toHaveLength(1);
});

test('a lost merge response is retried with the same mergeId and adds the guest cart once', async ({
  page,
}) => {
  const peru = product('peru-85-dark-bar');
  await page.goto(`/en/products/${peru.slug}`);
  await addFromProductPage(page, 2);
  await expectCount(page, 2);

  const mergeIds: string[] = [];
  await page.route('**/api/cart/merge', async (route) => {
    mergeIds.push(route.request().postDataJSON().mergeId);
    const response = await route.fetch(); // The server applies the merge...
    if (mergeIds.length === 1)
      await route.abort('failed'); // ...but the response is lost.
    else await route.fulfill({ response });
  });
  await signIn(page, accounts.retry);
  if (process.env.LIVE_EXPECT_FLOATING_NOTICE === '0') await cartButton(page).click();
  const failed = page.getByRole('alert').filter({ hasText: 'could not be added' });
  await expect(failed).toBeVisible();
  expect(await guestCart(page)).not.toBeNull(); // Kept until the server confirms.
  expect((await savedCart(accounts.retry)).items).toEqual([{ productId: peru.id, quantity: 2 }]);

  const retry = apiResponse(page, 'POST', '/api/cart/merge');
  await failed.getByRole('button', { name: 'Try again' }).click();
  expect((await retry).status()).toBe(200);
  expect(mergeIds).toHaveLength(2);
  expect(mergeIds[1]).toBe(mergeIds[0]);
  await expectCount(page, 2);
  expect((await savedCart(accounts.retry)).items).toEqual([{ productId: peru.id, quantity: 2 }]);
  expect(await guestCart(page)).toBeNull();
});

test('logout clears the private cart, another account never sees it, and it returns after sign-in', async ({
  page,
}) => {
  const cart = apiResponse(page, 'GET', '/api/cart');
  await signIn(page, accounts.merge);
  expect((await cart).status()).toBe(200);
  await expectCount(page, 4);

  await page
    .getByRole('banner')
    .getByRole('button', { name: /sign out/i })
    .click();
  await expectCount(page, 0);
  expect(await guestCart(page)).toBeNull(); // The private cart is not copied to the device.

  await signIn(page, accounts.other);
  await expectCount(page, 0);
  await page
    .getByRole('banner')
    .getByRole('button', { name: /sign out/i })
    .click();

  await signIn(page, accounts.merge);
  await expectCount(page, 4);
  // A full reload starts signed out (the token is in memory); the saved cart returns on sign-in.
  await page.reload();
  await expectCount(page, 0);
  await signIn(page, accounts.merge);
  await expectCount(page, 4);
});

test('a conflicting write from another window is reloaded, never overwritten', async ({ page }) => {
  const peru = product('peru-85-dark-bar');
  const ecuador = product('ecuador-72-dark-bar');
  await signIn(page, accounts.other);
  await inApp(page, `/en/products/${peru.slug}`);
  let save = apiResponse(page, 'POST', '/api/cart/persist');
  await addFromProductPage(page, 1);
  expect((await save).status()).toBe(200);
  const revision = (await savedCart(accounts.other)).revision;

  // "Another window" replaces the saved cart first.
  expect(
    (await persistAs(accounts.other, revision, [{ productId: ecuador.id, quantity: 2 }])).status(),
  ).toBe(200);

  save = apiResponse(page, 'POST', '/api/cart/persist');
  await addFromProductPage(page, 1);
  const refused = await save;
  expect(refused.status()).toBe(409);
  expect((await refused.json()).error.code).toBe('CART_CONFLICT');
  await cartButton(page).click();
  const drawer = page.getByRole('dialog', { name: 'Your cart' });
  await expect(drawer.getByRole('alert')).toContainText('changed in another window');
  await expectCount(page, 2); // The other window's cart, reloaded.
  expect((await savedCart(accounts.other)).items).toEqual([{ productId: ecuador.id, quantity: 2 }]);
  await page.keyboard.press('Escape');

  save = apiResponse(page, 'POST', '/api/cart/persist');
  await addFromProductPage(page, 1);
  expect((await save).status()).toBe(200);
  expect((await savedCart(accounts.other)).items).toEqual([
    { productId: ecuador.id, quantity: 2 },
    { productId: peru.id, quantity: 1 },
  ]);
});

test('signed-in checkout stores a simulated order at database prices; stock is unchanged', async ({
  page,
}) => {
  const eggs = product('spring-chocolate-eggs');
  const peru = product('peru-85-dark-bar');
  await signIn(page, accounts.merge);
  await expectCount(page, 4);
  await inApp(page, '/en/checkout');
  await expect(page.getByText(`3 × ${eggs.name.en}`)).toBeVisible();
  await expect(page.getByText(`1 × ${peru.name.en}`)).toBeVisible();
  const expected = 3 * eggs.priceCents + peru.priceCents;
  await expect(page.getByText(usd(expected), { exact: true }).first()).toBeVisible();
  await fillAddress(page, accounts.merge.email);

  const order = apiResponse(page, 'POST', '/api/orders');
  await page.getByRole('button', { name: 'Place demo order' }).click();
  const response = await order;
  expect(response.status()).toBe(201);
  const receipt = (await response.json()).data;
  expect(receipt).toMatchObject({ status: 'simulated', totalCents: expected, currency: 'USD' });
  await expect(
    page.getByRole('heading', { name: 'Thank you — demo order received' }),
  ).toBeVisible();
  await expect(page.getByText('Demo order — no payment collected')).toBeVisible();
  await expect(page.getByText(usd(expected), { exact: true })).toBeVisible();

  if (hasDb) {
    const stored = await db
      .collection('orders')
      .findOne({ _id: new mongoose.Types.ObjectId(receipt.id) });
    expect(stored).toMatchObject({
      status: 'simulated',
      totalCents: expected,
      email: accounts.merge.email,
    });
    expect(stored?.userId.toString()).toBe(accounts.merge.id);
    expect(stored?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ unitPriceCents: eggs.priceCents, quantity: 3 }),
        expect.objectContaining({ unitPriceCents: peru.priceCents, quantity: 1 }),
      ]),
    );
    expect(Object.keys(stored ?? {}).some((key) => /card|payment/i.test(key))).toBe(false);
  }
  expect((await (await api.get(`/api/products/${eggs.slug}`)).json()).data.stock).toBe(eggs.stock);
  // The checkout cleared the saved cart.
  await expectCount(page, 0);
  await expect.poll(async () => (await savedCart(accounts.merge)).items).toEqual([]);
});

test('stale stock at checkout is refused and explained, after switching to Spanish', async ({
  page,
}) => {
  test.skip(!hasDb, 'Needs write access to the API database to make the stock stale.');
  const eggs = product('spring-chocolate-eggs');
  const inventory = db.collection('inventory');
  const productId = new mongoose.Types.ObjectId(eggs.id);
  await page.goto(`/en/products/${eggs.slug}`);
  await addFromProductPage(page, 3);
  await page.goto('/en/checkout');
  await expect(page.getByText(`3 × ${eggs.name.en}`)).toBeVisible();
  await fillAddress(page, 'stale-stock@example.test');

  // The language switch keeps the form, the cart and the product.
  await page
    .getByRole('banner')
    .getByRole('link', { name: /Español/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/es\/checkout$/);
  await expect(page.getByText(`3 × ${eggs.name.es}`)).toBeVisible();
  await expect(page.getByLabel(/^Ciudad/)).toHaveValue('Austin');

  try {
    // Someone else bought most of the stock after the page loaded.
    await inventory.updateOne({ productId }, { $set: { availableUnits: 1 } });
    const order = apiResponse(page, 'POST', '/api/orders');
    await page.getByRole('button', { name: 'Realizar pedido de demostración' }).click();
    const response = await order;
    expect(response.status()).toBe(409);
    expect((await response.json()).error.code).toBe('OUT_OF_STOCK');
    await expect(page.getByText(/no están disponibles en la cantidad pedida/)).toBeVisible();
    await expect(
      page.getByText('No está disponible en esta cantidad. Actualiza tu carrito.'),
    ).toBeVisible();
    await expectCount(page, 3); // Nothing was ordered or removed.
  } finally {
    await inventory.updateOne({ productId }, { $set: { availableUnits: eggs.stock } });
  }
});

test('the language switch keeps filters, sort and the cart on the catalog', async ({ page }) => {
  const peru = product('peru-85-dark-bar');
  await page.goto('/en/catalog?origin=Peru&sort=priceAsc');
  const results = page.getByRole('region', { name: 'Results' });
  await results.getByRole('button', { name: `Add to cart: ${peru.name.en}` }).click();
  await expectCount(page, 1);
  const spanish = apiResponse(page, 'GET', '/api/products');
  await page
    .getByRole('banner')
    .getByRole('link', { name: /Español/ })
    .first()
    .click();
  expect(new URL((await spanish).url()).searchParams.get('locale')).toBe('es');
  await expect(page).toHaveURL(/\/es\/catalog\?origin=Peru&sort=priceAsc$/);
  await expectCount(page, 1);
  const es = page.getByRole('region', { name: 'Resultados' });
  await expect(es.getByRole('link', { name: peru.name.es })).toBeVisible();
  await expect(es.getByText(usd(peru.priceCents, 'es'), { exact: true })).toBeVisible();
});

test.describe('phone width', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('filter drawer, cart drawer and keyboard focus work without overflow', async ({ page }) => {
    const ghana = [...products.values()].find((p) => p.slug.startsWith('ghana'));
    await page.goto('/en/catalog');
    await expect(page.getByText(/\d+ chocolates/)).toBeVisible();
    await page.getByRole('button', { name: /^Filters/ }).click();
    const filters = page.getByRole('dialog', { name: 'Filters' });
    const filtered = apiResponse(page, 'GET', '/api/products');
    await filters.getByLabel('Origin').selectOption('Ghana');
    expect(new URL((await filtered).url()).searchParams.get('origin')).toBe('Ghana');
    // Selects apply at once; the drawer stays open until "Apply filters".
    await filters.getByRole('button', { name: 'Apply filters' }).click();
    await expect(filters).toBeHidden();
    await expect(page).toHaveURL(/origin=Ghana/);

    const results = page.getByRole('region', { name: 'Results' });
    if (ghana) await results.getByRole('button', { name: `Add to cart: ${ghana.name.en}` }).click();
    await expectCount(page, ghana ? 1 : 0);
    const opener = cartButton(page);
    await opener.focus();
    await page.keyboard.press('Enter');
    const drawer = page.getByRole('dialog', { name: 'Your cart' });
    await expect(drawer).toBeVisible();
    expect(await drawer.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(opener).toBeFocused();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
});

test('the homepage and the sampler show the same live products, prices and images', async ({
  page,
}) => {
  const featured = (await (
    await api.get('/api/products?limit=4&sort=name&locale=en')
  ).json()) as Product[];
  await page.goto('/en');
  const main = page.getByRole('main');
  for (const item of featured) {
    const link = main.getByRole('link', { name: item.name.en, exact: true });
    await link.scrollIntoViewIfNeeded();
    await expect(link).toHaveAttribute('href', `/en/products/${item.slug}`);
    const card = main
      .getByRole('listitem')
      .filter({ has: page.getByRole('link', { name: item.name.en, exact: true }) });
    await expect(card.getByText(usd(item.priceCents), { exact: true })).toBeVisible();
    await expect(card.getByRole('img', { name: item.images[0].alt.en })).toHaveAttribute(
      'src',
      item.images[0].url,
    );
  }

  await page.goto('/en/sampler');
  for (const item of products.values()) {
    const card = page.getByRole('article').filter({
      has: page.getByRole('heading', { name: item.name.en, exact: true }),
    });
    await expect(card).toHaveCount(1);
    await expect(card.getByRole('img')).toHaveAttribute('src', item.images[0].url);
  }
});
