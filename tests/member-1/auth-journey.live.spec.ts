// Student 1 Phase 3 journey: the real UI in HTTP mode (Vite dev, React StrictMode) over the compiled
// API and a real MongoDB. API checks go straight to the API origin, so no UI guard is involved.
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';

const API = process.env.LIVE_API_URL ?? 'http://127.0.0.1:4000';
const MONGO_CONTAINER = process.env.MONGO_CONTAINER ?? 'solcacao-mongo-1';
const MONGO_DB = process.env.LIVE_MONGODB_URI ?? 'mongodb://127.0.0.1:27017/solcacao_p3_member1';
const PASSWORD = 'member1-phase3-pass';
const unique = (p) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;
const banner = (page) => page.getByRole('banner');
const mongo = (js) =>
  execFileSync('docker', ['exec', MONGO_CONTAINER, 'mongosh', '--quiet', MONGO_DB, '--eval', js])
    .toString()
    .trim();
const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
const log = (...a) => console.log('[evidence]', ...a);

async function apiLogin(request, email) {
  const r = await request.post(`${API}/api/auth/login`, { data: { email, password: PASSWORD } });
  expect(r.status()).toBe(200);
  return (await r.json()).data.token;
}
async function apiRegister(request, email, role) {
  const r = await request.post(`${API}/api/auth/register`, {
    data: {
      name: 'Phase3 API ' + role,
      email,
      password: PASSWORD,
      role,
      ...(role === 'b2b' ? { companyName: 'Fictional Phase3 Co' } : {}),
    },
  });
  expect(r.status()).toBe(201);
  return (await r.json()).data.token;
}
const auth = (token) => ({ Authorization: `Bearer ${token}` });
const quoteForm = (requestId) => ({
  metadata: JSON.stringify({
    cacaoProfile: 'dark70',
    quantity: 120,
    packaging: 'sleeve',
    companyName: 'Fictional Phase3 Co',
    contactEmail: 'buyer@example.test',
    locale: 'en',
    requestId,
  }),
  designFile: { name: 'brand.pdf', mimeType: 'application/pdf', buffer: pdf },
});

test('step 1-2: register with a guest cart, token before merge, no StrictMode duplicates, account, reload, late response after logout', async ({
  page,
}) => {
  const email = unique('retail');
  const events = [];
  page.on('request', (r) => {
    const p = new URL(r.url()).pathname;
    if (p.startsWith('/api/auth') || p.startsWith('/api/cart') || p.startsWith('/api/users'))
      events.push({ t: 'req', m: r.method(), p, auth: r.headers().authorization ?? null });
  });
  page.on('response', async (r) => {
    const p = new URL(r.url()).pathname;
    if (p === '/api/auth/register' || p === '/api/auth/login')
      events.push({
        t: 'res',
        m: r.request().method(),
        p,
        s: r.status(),
        token: (await r.json().catch(() => ({})))?.data?.token,
      });
  });
  const consoleErrors = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  // Guest cart first, so registration triggers the merge.
  await page.goto('/en/products/peru-85-dark-bar');
  await page
    .getByRole('button', { name: /add to cart/i })
    .first()
    .click();
  await expect(banner(page).getByRole('button', { name: /cart/i })).toHaveAccessibleName(
    'Open cart. Items: 1',
  );

  await page.goto('/en/register');
  await page.getByLabel(/^full name/i).fill('Phase3 Retail');
  await page.getByLabel(/^email/i).fill(email);
  await page.getByLabel(/^password/i).fill(PASSWORD);
  const merged = page.waitForResponse((r) => new URL(r.url()).pathname === '/api/cart/merge');
  await page.getByRole('button', { name: /^create account$/i }).click();
  expect((await merged).status()).toBe(200);
  await expect(page).toHaveURL(/\/en\/account$/);
  await expect(banner(page).getByRole('button', { name: /cart/i })).toHaveAccessibleName(
    'Open cart. Items: 1',
  );
  await page.waitForTimeout(500);

  const reg = events.filter((e) => e.t === 'req' && e.p === '/api/auth/register');
  const regRes = events.findIndex((e) => e.t === 'res' && e.p === '/api/auth/register');
  const mergeIdx = events.findIndex((e) => e.t === 'req' && e.p === '/api/cart/merge');
  const merges = events.filter((e) => e.t === 'req' && e.p === '/api/cart/merge');
  const token = events[regRes].token;
  log('order:', events.map((e) => `${e.t}:${e.m} ${e.p}${e.auth ? ' [bearer]' : ''}`).join(' | '));
  expect(reg).toHaveLength(1);
  expect(merges).toHaveLength(1);
  expect(mergeIdx).toBeGreaterThan(regRes);
  expect(merges[0].auth).toBe(`Bearer ${token}`);
  const users = mongo(`db.users.countDocuments({email:${JSON.stringify(email)}})`);
  const uid = mongo(`db.users.findOne({email:${JSON.stringify(email)}})._id.toString()`);
  const carts = mongo(`db.carts.countDocuments({userId:ObjectId(${JSON.stringify(uid)})})`);
  const cart = mongo(
    `JSON.stringify(db.carts.findOne({userId:ObjectId(${JSON.stringify(uid)})},{items:1,revision:1,_id:0}))`,
  );
  const hash = mongo(`db.users.findOne({email:${JSON.stringify(email)}}).passwordHash.slice(0,7)`);
  log(
    'mongo users with email:',
    users,
    '| carts for user:',
    carts,
    '| cart:',
    cart,
    '| hash prefix:',
    hash,
  );
  expect(users).toBe('1');
  expect(carts).toBe('1');
  expect(hash).toBe('$2b$12$');

  // Account: profile and address persist in MongoDB.
  await page.getByLabel(/^full name/i).fill('Phase3 Renamed');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile saved.')).toBeVisible();
  await page.getByRole('button', { name: 'Add an address' }).click();
  await page.getByLabel(/^recipient/i).fill('Phase3 Person');
  await page.getByLabel(/^address line 1/i).fill('1 Example Street');
  await page.getByLabel(/^city/i).fill('Testville');
  await page.getByLabel(/^state, province or region/i).fill('TX');
  await page.getByLabel(/^postal code/i).fill('75001');
  await page.getByRole('button', { name: 'Save address' }).click();
  await expect(page.getByText('Address saved.')).toBeVisible();
  log(
    'mongo user name:',
    mongo(`db.users.findOne({_id:ObjectId(${JSON.stringify(uid)})}).name`),
    '| addresses:',
    mongo(`db.addresses.countDocuments({userId:ObjectId(${JSON.stringify(uid)})})`),
  );

  // Reload: memory-only token, so the account page asks for sign-in again.
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in to continue' })).toBeVisible();
  log('after reload: sign-in prompt shown');

  // A response that arrives after logout cannot restore the user.
  await page.goto('/en/login?returnTo=%2Fen%2Faccount');
  await page.getByLabel(/^email/i).fill(email);
  await page.getByLabel(/^password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();
  let release;
  const held = new Promise((r) => (release = r));
  await page.route('**/api/users/me', async (route) => {
    await held;
    await route.continue();
  });
  await page.getByLabel(/^full name/i).fill('Late Rename');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await page.getByRole('main').getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in to continue' })).toBeVisible();
  const lateResponse = page.waitForResponse((r) => new URL(r.url()).pathname === '/api/users/me');
  release();
  expect((await lateResponse).status()).toBe(200);
  await page.waitForTimeout(300);
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in to continue' })).toBeVisible();
  await expect(banner(page).getByRole('button', { name: /sign out/i })).toHaveCount(0);
  await expect(banner(page).getByRole('button', { name: /cart/i })).toHaveAccessibleName(
    'Open cart. Items: 0',
  );
  log(
    'late PATCH /api/users/me answered 200 after logout; UI stayed signed out, cart empty as guest',
  );

  // Error translation: wrong password in Spanish.
  await page.goto('/es/login');
  await page.getByLabel(/^correo/i).fill(email);
  await page.getByLabel(/^contraseña/i).fill('wrong-password-123');
  await page.getByRole('button', { name: /^iniciar sesión$/i }).click();
  await expect(page.getByText('El correo o la contraseña no son correctos.')).toBeVisible();
  log('ES wrong password message shown');
  log(
    'console errors:',
    consoleErrors.length,
    consoleErrors.filter((e) => !/401/.test(e)),
  );
});

test('step 1: StrictMode sign-in sends one login and one cart load', async ({ page, request }) => {
  const email = unique('strict');
  await apiRegister(request, email, 'retail');
  const calls = [];
  page.on('request', (r) => {
    const p = new URL(r.url()).pathname;
    if (p.startsWith('/api/auth') || p.startsWith('/api/cart')) calls.push(`${r.method()} ${p}`);
  });
  await page.goto('/en/login');
  await page.getByLabel(/^email/i).fill(email);
  await page.getByLabel(/^password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();
  await page.waitForTimeout(800);
  log('StrictMode sign-in calls:', calls.join(', '));
  expect(calls.filter((c) => c === 'POST /api/auth/login')).toHaveLength(1);
  expect(calls.filter((c) => c === 'POST /api/cart/merge')).toHaveLength(0);
});

test('step 3: quote wizard entry as guest, retail and business', async ({ page, request }) => {
  const retail = unique('retail-w');
  const business = unique('b2b-w');
  await apiRegister(request, retail, 'retail');
  await apiRegister(request, business, 'b2b');
  await page.goto('/en/wholesale/request');
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in to continue' })).toBeVisible();
  log('guest -> sign-in prompt');
  for (const [email, heading] of [
    [retail, 'Business account required'],
    [business, 'Request a custom quote'],
  ]) {
    await page.goto('/en/login?returnTo=%2Fen%2Fwholesale%2Frequest');
    await page.getByLabel(/^email/i).fill(email);
    await page.getByLabel(/^password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/en\/wholesale\/request$/);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    log(email.split('-')[0], '->', heading);
    await page.reload(); // signs out (memory-only token)
  }
});

test('step 3: direct API calls are refused without the right sign-in', async ({ request }) => {
  const retail = await apiRegister(request, unique('retail-api'), 'retail');
  const owner = await apiRegister(request, unique('b2b-owner'), 'b2b');
  const other = await apiRegister(request, unique('b2b-other'), 'b2b');
  const post = (headers, id = crypto.randomUUID()) =>
    request.post(`${API}/api/b2b/quote`, { headers, multipart: quoteForm(id) });
  const results = {};
  results.quoteNoToken = (await post({})).status();
  results.quoteMalformedToken = (await post({ Authorization: 'Bearer not-a-jwt' })).status();
  results.quoteForgedToken = (
    await post(auth('eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4Iiwicm9sZSI6ImIyYiJ9.'))
  ).status();
  results.quoteRetail = (await post(auth(retail))).status();
  const created = await post(auth(owner));
  results.quoteOwner = created.status();
  const id = (await created.json()).data.id;
  const file = (headers) => request.get(`${API}/api/b2b/quotes/${id}/file`, { headers });
  results.fileNoToken = (await file({})).status();
  results.fileRetail = (await file(auth(retail))).status();
  results.fileOtherBusiness = (await file(auth(other))).status();
  const own = await file(auth(owner));
  results.fileOwner = own.status();
  results.fileHeaders = {
    disposition: own.headers()['content-disposition'],
    nosniff: own.headers()['x-content-type-options'],
  };
  results.receiptOtherBusiness = (
    await request.get(`${API}/api/b2b/quotes/${id}`, { headers: auth(other) })
  ).status();
  results.meNoToken = (await request.get(`${API}/api/auth/me`)).status();
  results.profileRoleEscalation = (
    await request.patch(`${API}/api/users/me`, {
      headers: auth(retail),
      data: { name: 'X', role: 'b2b' },
    })
  ).status();
  const addr = await request.post(`${API}/api/users/me/addresses`, {
    headers: auth(owner),
    data: { recipient: 'R', line1: 'L', city: 'C', region: 'R', postalCode: '1', country: 'US' },
  });
  const addrId = (await addr.json()).data.id;
  results.addressOfOtherUser = (
    await request.post(`${API}/api/users/me/addresses`, {
      headers: auth(retail),
      data: {
        id: addrId,
        recipient: 'Hijack',
        line1: 'L',
        city: 'C',
        region: 'R',
        postalCode: '1',
        country: 'US',
      },
    })
  ).status();
  log(JSON.stringify(results));
  expect(results).toMatchObject({
    quoteNoToken: 401,
    quoteMalformedToken: 401,
    quoteForgedToken: 401,
    quoteRetail: 403,
    quoteOwner: 201,
    fileNoToken: 401,
    fileRetail: 403,
    fileOtherBusiness: 404,
    fileOwner: 200,
    receiptOtherBusiness: 404,
    meNoToken: 401,
    profileRoleEscalation: 400,
    addressOfOtherUser: 404,
  });
});

test('step 4: the one-hour session ends into a recoverable sign-in with a safe returnTo; no retry loop', async ({
  page,
  request,
}) => {
  const email = unique('expiry');
  await apiRegister(request, email, 'retail');
  await page.clock.install();
  const calls = [];
  page.on('request', (r) => {
    const p = new URL(r.url()).pathname;
    if (p.startsWith('/api/auth') || p.startsWith('/api/users')) calls.push(`${r.method()} ${p}`);
  });
  await page.goto('/en/login?returnTo=%2Fen%2Faccount');
  await page.getByLabel(/^email/i).fill(email);
  await page.getByLabel(/^password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();
  // Let the page's own initial loads (StrictMode runs the address load twice) finish first.
  await expect(page.getByText('No saved addresses yet.')).toBeVisible();
  await page.waitForLoadState('networkidle');
  const before = calls.length;
  await page.clock.fastForward('01:00:05');
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in to continue' })).toBeVisible();
  const link = await page
    .getByRole('link', { name: 'Open the full sign-in page' })
    .getAttribute('href');
  await page.clock.fastForward('00:05:00');
  log(
    'expiry: prompt shown, sign-in link',
    link,
    '| auth calls after expiry:',
    calls.slice(before),
  );
  expect(link).toBe('/en/login?returnTo=%2Fen%2Faccount');
  expect(calls.length - before).toBe(0);
  // Unsafe returnTo values fall back to the account page.
  for (const bad of [
    'https://evil.example/',
    '//evil.example',
    '/en//evil.example',
    '/%2F%2Fevil.example',
  ]) {
    await page.goto('/en/login?returnTo=' + encodeURIComponent(bad));
    await page.getByLabel(/^email/i).fill(email);
    await page.getByLabel(/^password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/en\/account$/);
    await page.reload();
  }
  log('unsafe returnTo values all landed on /en/account');
});
