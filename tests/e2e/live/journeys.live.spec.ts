import { test, expect, type Page } from '@playwright/test';

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

  // The session lives in memory, so a reload signs out; the cart is saved on the server.
  await page.reload();
  await expect(signOutButton(page)).toHaveCount(0);
  await signIn(page, email);
  await expect(cartButton(page)).toHaveAccessibleName('Open cart. Items: 1');
});

// Journeys of later D22 turns. Student 2 fills them in the closing turn from the owners' handoff
// proposals, once their PRs have merged.
test.fixme('a business buyer sends a quote with a PDF and the email reaches Mailpit', () => {});
test.fixme('a six-piece sampler enquiry is saved and its email reaches Mailpit', () => {});
