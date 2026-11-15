// Student 1 Phase 4: the same journey on the deployed site (production build, real Railway MongoDB).
// Fictional @example.test accounts only.
import { test, expect } from '@playwright/test';
const SITE = process.env.LIVE_SITE_URL ?? 'https://solcacao-production.up.railway.app';
const PASSWORD = 'member1-phase4-pass';
const unique = (p) =>
  `m1-${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;
const banner = (page) => page.getByRole('banner');
const log = (...a) => console.log('[live]', ...a);
const auth = (t) => ({ Authorization: `Bearer ${t}` });
const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
async function apiRegister(request, email, role) {
  const r = await request.post(`${SITE}/api/auth/register`, {
    data: {
      name: 'M1 Live ' + role,
      email,
      password: PASSWORD,
      role,
      ...(role === 'b2b' ? { companyName: 'Fictional Live Co' } : {}),
    },
  });
  expect(r.status()).toBe(201);
  const body = await r.json();
  return body.data.token;
}

test('live: register with guest cart, token before merge, account, reload, late response after logout, wizard entry', async ({
  page,
  request,
}) => {
  const email = unique('retail');
  const events = [];
  const consoleErrors = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('request', (r) => {
    const p = new URL(r.url()).pathname;
    if (/^\/api\/(auth|cart|users)/.test(p))
      events.push({ t: 'req', m: r.method(), p, auth: r.headers().authorization ?? null });
  });
  page.on('response', async (r) => {
    const p = new URL(r.url()).pathname;
    if (p === '/api/auth/register')
      events.push({
        t: 'res',
        p,
        s: r.status(),
        token: (await r.json().catch(() => ({})))?.data?.token,
      });
  });

  await page.goto(`${SITE}/en/products/peru-85-dark-bar`);
  await page
    .getByRole('button', { name: /add to cart/i })
    .first()
    .click();
  await expect(banner(page).getByRole('button', { name: /cart/i })).toHaveAccessibleName(
    'Open cart. Items: 1',
  );
  await page.goto(`${SITE}/en/register`);
  await page.getByLabel(/^full name/i).fill('M1 Live Retail');
  await page.getByLabel(/^email/i).fill(email);
  await page.getByLabel(/^password/i).fill(PASSWORD);
  const merged = page.waitForResponse((r) => new URL(r.url()).pathname === '/api/cart/merge');
  await page.getByRole('button', { name: /^create account$/i }).click();
  expect((await merged).status()).toBe(200);
  await expect(page).toHaveURL(/\/en\/account$/);
  await expect(banner(page).getByRole('button', { name: /cart/i })).toHaveAccessibleName(
    'Open cart. Items: 1',
  );
  const regRes = events.findIndex((e) => e.t === 'res');
  const mergeIdx = events.findIndex((e) => e.p === '/api/cart/merge');
  log(
    'order:',
    events.map((e) => `${e.t}:${e.m ?? ''} ${e.p}${e.auth ? ' [bearer]' : ''}`).join(' | '),
  );
  expect(events.filter((e) => e.t === 'req' && e.p === '/api/auth/register')).toHaveLength(1);
  expect(events.filter((e) => e.p === '/api/cart/merge')).toHaveLength(1);
  expect(mergeIdx).toBeGreaterThan(regRes);
  expect(events[mergeIdx].auth).toBe(`Bearer ${events[regRes].token}`);

  await page.getByLabel(/^full name/i).fill('M1 Live Renamed');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile saved.')).toBeVisible();
  await page.getByRole('button', { name: 'Add an address' }).click();
  await page.getByLabel(/^recipient/i).fill('Live Person');
  await page.getByLabel(/^address line 1/i).fill('1 Example Street');
  await page.getByLabel(/^city/i).fill('Testville');
  await page.getByLabel(/^state, province or region/i).fill('TX');
  await page.getByLabel(/^postal code/i).fill('75001');
  await page.getByRole('button', { name: 'Save address' }).click();
  await expect(page.getByText('Address saved.')).toBeVisible();

  // Stored identity, read back through a fresh API login (hash never returned).
  const login = await request.post(`${SITE}/api/auth/login`, {
    data: { email, password: PASSWORD },
  });
  const session = (await login.json()).data;
  const addresses = (
    await (
      await request.get(`${SITE}/api/users/me/addresses`, { headers: auth(session.token) })
    ).json()
  ).data;
  const cart = (
    await (await request.get(`${SITE}/api/cart`, { headers: auth(session.token) })).json()
  ).data;
  log(
    'stored user:',
    JSON.stringify(session.user),
    '| keys:',
    Object.keys(session.user).join(','),
    '| addresses:',
    addresses.length,
    '| cart:',
    JSON.stringify(cart.items),
    'rev',
    cart.revision,
    '| expiresAt-now(min):',
    Math.round((Date.parse(session.expiresAt) - Date.now()) / 60000),
  );
  expect(session.user.name).toBe('M1 Live Renamed');
  expect(session.user).not.toHaveProperty('passwordHash');
  expect(addresses).toHaveLength(1);

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in to continue' })).toBeVisible();
  log('reload -> sign-in prompt');

  await page.goto(`${SITE}/en/login?returnTo=%2Fen%2Faccount`);
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
  const late = page.waitForResponse((r) => new URL(r.url()).pathname === '/api/users/me');
  release();
  log('late PATCH status after logout:', (await late).status());
  await page.waitForTimeout(500);
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in to continue' })).toBeVisible();
  await expect(banner(page).getByRole('button', { name: /sign out/i })).toHaveCount(0);
  await expect(banner(page).getByRole('button', { name: /cart/i })).toHaveAccessibleName(
    'Open cart. Items: 0',
  );
  log('late response after logout: still signed out, guest cart empty');
  await page.unroute('**/api/users/me');

  // Wizard entry: guest, retail, business.
  const business = unique('b2b');
  await apiRegister(request, business, 'b2b');
  await page.goto(`${SITE}/en/wholesale/request`);
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in to continue' })).toBeVisible();
  for (const [who, heading] of [
    [email, 'Business account required'],
    [business, 'Request a custom quote'],
  ]) {
    await page.goto(`${SITE}/en/login?returnTo=%2Fen%2Fwholesale%2Frequest`);
    await page.getByLabel(/^email/i).fill(who);
    await page.getByLabel(/^password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/en\/wholesale\/request$/);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    log(who.split('-')[1], '->', heading);
    await page.reload();
  }
  await page.goto(`${SITE}/es/login`);
  await page.getByLabel(/^correo/i).fill(email);
  await page.getByLabel(/^contraseña/i).fill('wrong-password-123');
  await page.getByRole('button', { name: /^iniciar sesión$/i }).click();
  await expect(page.getByText('El correo o la contraseña no son correctos.')).toBeVisible();
  log('ES wrong-password message shown');
  log(
    'console errors (excluding expected 401 resource loads):',
    consoleErrors.filter((e) => !/401/.test(e)),
  );
});

test('live: direct API access control', async ({ request }) => {
  const retail = await apiRegister(request, unique('retail-api'), 'retail');
  const owner = await apiRegister(request, unique('b2b-owner'), 'b2b');
  const other = await apiRegister(request, unique('b2b-other'), 'b2b');
  const form = (requestId) => ({
    metadata: JSON.stringify({
      cacaoProfile: 'dark70',
      quantity: 120,
      packaging: 'sleeve',
      companyName: 'Fictional Live Co',
      contactEmail: 'buyer@example.test',
      notes: 'Member 1 Phase 4 access-control check (fictional)',
      locale: 'en',
      requestId,
    }),
    designFile: { name: 'brand.pdf', mimeType: 'application/pdf', buffer: pdf },
  });
  const post = (headers) =>
    request.post(`${SITE}/api/b2b/quote`, { headers, multipart: form(crypto.randomUUID()) });
  const r = {};
  r.quoteNoToken = (await post({})).status();
  r.quoteForgedAlgNone = (
    await post(auth('eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4Iiwicm9sZSI6ImIyYiJ9.'))
  ).status();
  r.quoteRetail = (await post(auth(retail))).status();
  const created = await post(auth(owner));
  r.quoteOwner = created.status();
  const id = (await created.json()).data.id;
  const file = (h) => request.get(`${SITE}/api/b2b/quotes/${id}/file`, { headers: h });
  r.fileNoToken = (await file({})).status();
  r.fileRetail = (await file(auth(retail))).status();
  r.fileOtherBusiness = (await file(auth(other))).status();
  const own = await file(auth(owner));
  r.fileOwner = own.status();
  r.fileOwnerHeaders = `${own.headers()['content-disposition']} | ${own.headers()['x-content-type-options']} | ${own.headers()['cache-control']}`;
  r.meNoToken = (await request.get(`${SITE}/api/auth/me`)).status();
  r.meRetail = (await request.get(`${SITE}/api/auth/me`, { headers: auth(retail) })).status();
  r.roleEscalation = (
    await request.patch(`${SITE}/api/users/me`, {
      headers: auth(retail),
      data: { name: 'X', role: 'b2b' },
    })
  ).status();
  r.registerAdmin = (
    await request.post(`${SITE}/api/auth/register`, {
      data: { name: 'X', email: unique('admin'), password: PASSWORD, role: 'admin' },
    })
  ).status();
  const a = await request.post(`${SITE}/api/users/me/addresses`, {
    headers: auth(owner),
    data: { recipient: 'R', line1: 'L', city: 'C', region: 'R', postalCode: '1', country: 'US' },
  });
  r.addressOfOtherUser = (
    await request.post(`${SITE}/api/users/me/addresses`, {
      headers: auth(retail),
      data: {
        id: (await a.json()).data.id,
        recipient: 'Hijack',
        line1: 'L',
        city: 'C',
        region: 'R',
        postalCode: '1',
        country: 'US',
      },
    })
  ).status();
  const dup = await request.post(`${SITE}/api/auth/register`, {
    data: {
      name: 'Dup',
      email: unique('dup').replace(/\d+-/, 'x-'),
      password: PASSWORD,
      role: 'retail',
    },
  });
  r.quoteId = id;
  log(JSON.stringify(r));
  expect(r).toMatchObject({
    quoteNoToken: 401,
    quoteForgedAlgNone: 401,
    quoteRetail: 403,
    quoteOwner: 201,
    fileNoToken: 401,
    fileRetail: 403,
    fileOtherBusiness: 404,
    fileOwner: 200,
    meNoToken: 401,
    meRetail: 200,
    roleEscalation: 400,
    registerAdmin: 400,
    addressOfOtherUser: 404,
  });
});
