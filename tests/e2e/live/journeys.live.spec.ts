import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// Phase 3 cross-feature journeys against the live API and MongoDB (D22). Each test waits for the
// real /api response it depends on, so none of them can pass against mock adapters.
const PASSWORD = 'live-test-password-123';
const cartButton = (page: Page) => page.getByRole('banner').getByRole('button', { name: /cart/i });
const signOutButton = (page: Page) =>
  page.getByRole('banner').getByRole('button', { name: /sign out/i });
const uniqueEmail = () =>
  `live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
const apiResponse = (page: Page, method: string, path: string) =>
  page.waitForResponse(
    (r) => r.request().method() === method && new URL(r.url()).pathname === path,
  );

async function register(page: Page, email: string) {
  await page.goto('/en/register');
  await page.getByLabel(/^full name/i).fill('Live Test Shopper');
  await page.getByLabel(/^email/i).fill(email);
  await page.getByLabel(/^password/i).fill(PASSWORD);
  const created = apiResponse(page, 'POST', '/api/auth/register');
  await page.getByRole('button', { name: /^create account$/i }).click();
  expect((await created).status()).toBe(201);
  await expect(page).toHaveURL(/\/en\/account$/);
}

async function signIn(page: Page, email: string) {
  await page.goto('/en/login');
  await page.getByLabel(/^email/i).fill(email);
  await page.getByLabel(/^password/i).fill(PASSWORD);
  const login = apiResponse(page, 'POST', '/api/auth/login');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  expect((await login).status()).toBe(200);
}

async function addPeruBar(page: Page) {
  await page.goto('/en/products/peru-85-dark-bar');
  await page
    .getByRole('button', { name: /add to cart/i })
    .first()
    .click();
  await expect(cartButton(page)).toHaveAccessibleName('Open cart. Items: 1');
}

test('the catalog comes from the live API, and a failed request shows the error state', async ({
  page,
}) => {
  const products = apiResponse(page, 'GET', '/api/products');
  await page.goto('/en/catalog');
  expect((await products).status()).toBe(200);
  await expect(page.getByRole('link', { name: 'Peru 85% Dark Bar' })).toBeVisible();

  await page.route('**/api/products**', (route) => route.abort());
  await page.goto('/en/catalog?origin=Peru');
  await expect(page.getByText('Chocolates could not be loaded')).toBeVisible();
});

test('a guest order is created by the live API with a server-side total', async ({ page }) => {
  await addPeruBar(page);
  await page.goto('/en/checkout');
  await page.getByLabel(/^email/i).fill('guest@example.test');
  await page.getByLabel(/^full name/i).fill('Live Test Guest');
  await page.getByLabel(/^address line 1/i).fill('1 Cacao Lane');
  await page.getByLabel(/^city/i).fill('Austin');
  await page.getByLabel(/^state, province or region/i).fill('TX');
  await page.getByLabel(/^postal code/i).fill('78701');
  const order = apiResponse(page, 'POST', '/api/orders');
  await page.getByRole('button', { name: 'Place demo order' }).click();
  const response = await order;
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.data).toMatchObject({ status: 'simulated', totalCents: 999, currency: 'USD' });
  await expect(
    page.getByRole('heading', { name: 'Thank you — demo order received' }),
  ).toBeVisible();
  await expect(cartButton(page)).toHaveAccessibleName('Open cart. Items: 0');
});

test('a guest cart merges on sign-in and the saved cart survives a reload', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  await signOutButton(page).click();
  await expect(cartButton(page)).toHaveAccessibleName('Open cart. Items: 0');

  await addPeruBar(page);
  const merge = apiResponse(page, 'POST', '/api/cart/merge');
  await signIn(page, email);
  expect((await merge).status()).toBe(200);
  await expect(cartButton(page)).toHaveAccessibleName('Open cart. Items: 1');
  // Student 3's proposal 8: shoppers see the merge result outside the drawer too.
  await expect(page.getByRole('complementary', { name: 'Cart update' })).toContainText(
    'We added the items',
  );

  // The session lives in memory, so a reload signs out; the cart is saved on the server.
  await page.reload();
  await expect(signOutButton(page)).toHaveCount(0);
  await signIn(page, email);
  await expect(cartButton(page)).toHaveAccessibleName('Open cart. Items: 1');
});

test('a contact enquiry is saved and its email reaches the Mailpit inbox', async ({
  page,
  request,
}) => {
  const marker = `live${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  await page.goto('/en/contact');
  await page.getByLabel(/^name/i).fill('Live Test Contact');
  await page.getByLabel(/^email/i).fill(`${marker}@example.test`);
  await page.getByLabel(/^message/i).fill(`Live-API mail check ${marker}: do you ship gift boxes?`);
  const saved = apiResponse(page, 'POST', '/api/inquiries');
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  expect((await saved).status()).toBe(201);
  await expect(page.getByText('The enquiry notification was sent.')).toBeVisible();
  // The receipt only reports what SMTP accepted; the inbox shows the message actually arrived.
  await expect.poll(() => mailpitCount(request, marker)).toBeGreaterThan(0);
});

// Messages in Mailpit's inbox that match a search, 0 while Mailpit is unreachable.
async function mailpitCount(request: APIRequestContext, query: string) {
  const mailpit = process.env.MAILPIT_URL ?? 'http://127.0.0.1:8025';
  const found = await request.get(`${mailpit}/api/v1/search?query=${encodeURIComponent(query)}`);
  return found.ok() ? ((await found.json()).messages?.length ?? 0) : 0;
}

// Student 4's proposal 1 (team/member-4/handoff.md). The longer quote journeys (lost response,
// refused session, expiry, Mailpit stopped) stay in tests/member-4/quote-journey.live.spec.ts.
test('a business buyer sends a quote with a PDF and the email reaches Mailpit', async ({
  page,
  request,
}) => {
  const marker = `quote${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const pdf = {
    name: `brand-${marker}.pdf`,
    mimeType: 'application/pdf',
    buffer: Buffer.from(`%PDF-1.4\n% synthetic live test file ${marker}\n%%EOF\n`),
  };

  // A business account; then in-app navigation only, because the session lives in memory.
  await page.goto('/en/register?role=b2b');
  await page.getByLabel(/^full name/i).fill('Live Test Buyer');
  await page.getByLabel(/^email/i).fill(uniqueEmail());
  await page.getByLabel(/^password/i).fill(PASSWORD);
  await page.getByRole('radio', { name: /^business/i }).check();
  await page.getByLabel(/^company name/i).fill('Live Test Hotel');
  const created = apiResponse(page, 'POST', '/api/auth/register');
  await page.getByRole('button', { name: /^create account$/i }).click();
  expect((await created).status()).toBe(201);
  const token: string = (await (await created).json()).data.token;
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Wholesale' })
    .click();
  await page.getByRole('link', { name: 'Start your custom quote' }).click();

  await page.getByRole('radio', { name: /Dark 70%/ }).check();
  await page.getByLabel('Quantity (units)').fill('250');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Branding file (PDF)').setInputFiles(pdf);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('radio', { name: /Gift box/ }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('form')).toContainText(pdf.name);

  const sent = apiResponse(page, 'POST', '/api/b2b/quote');
  await page.getByRole('button', { name: 'Send quote request' }).click();
  const response = await sent;
  expect(response.status()).toBe(201);
  expect(await response.request().headerValue('authorization')).toMatch(/^Bearer \S+$/);
  const receipt = (await response.json()).data;
  expect(receipt).toMatchObject({ status: 'submitted', notificationStatus: 'sent' });
  await expect(page.getByRole('heading', { name: 'Quote request received' })).toBeVisible();

  // The private file comes back unchanged to its owner only; the email is in the inbox.
  const file = await request.get(`/api/b2b/quotes/${receipt.id}/file`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(file.status()).toBe(200);
  expect(file.headers()['content-disposition']).toBe(`attachment; filename="${pdf.name}"`);
  expect(Buffer.from(await file.body()).equals(pdf.buffer)).toBe(true);
  expect((await request.get(`/api/b2b/quotes/${receipt.id}/file`)).status()).toBe(401);
  await expect.poll(() => mailpitCount(request, receipt.id)).toBe(1);
});

// Student 5's proposal (team/member-5/handoff.md), plus the inbox check. The deeper database and
// mail proof (one document, one mail, tampered IDs refused) stays in tests/member-5.
test('a six-piece sampler posts real product IDs, replays one saved enquiry and its email reaches Mailpit', async ({
  page,
  request,
}) => {
  const marker = `sampler${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const products = apiResponse(page, 'GET', '/api/products');
  await page.goto('/en/sampler');
  expect((await products).status()).toBe(200);
  const add = page.getByRole('button', { name: /^Add one / }).first();
  await expect(add).toBeVisible();
  for (let piece = 0; piece < 6; piece++) await add.click();
  await page.locator('#support-name').fill('Synthetic Sampler Shopper');
  await page.locator('#support-email').fill(uniqueEmail());
  await page.locator('#support-message').fill(`A synthetic six-piece sampler enquiry ${marker}.`);
  const saved = apiResponse(page, 'POST', '/api/inquiries');
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click();
  const response = await saved;
  expect(response.status()).toBe(201);
  const body = response.request().postDataJSON();
  expect(body.category).toBe('sampler');
  expect(
    body.samplerItems.reduce((n: number, item: { quantity: number }) => n + item.quantity, 0),
  ).toBe(6);
  for (const item of body.samplerItems) {
    expect(item.productId).toMatch(/^[a-f0-9]{24}$/i);
    expect(Object.keys(item).sort()).toEqual(['productId', 'quantity']);
  }
  const receipt = (await response.json()).data;
  expect(receipt).toMatchObject({ status: 'received', notificationStatus: 'sent' });
  const replay = await request.post('/api/inquiries', { data: body });
  expect(replay.status()).toBe(201);
  expect((await replay.json()).data).toEqual(receipt);
  await expect(page.getByText('Your enquiry has been saved.', { exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: receipt.id })).toBeFocused();
  await expect.poll(() => mailpitCount(request, marker)).toBe(1);
});
