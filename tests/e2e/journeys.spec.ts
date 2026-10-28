import { test, expect, type Page } from '@playwright/test';

// Phase 2 cross-feature journeys in mock mode: shell + auth (Student 1) + catalog/cart (Student 3)
// + B2B wizard (Student 4). Fictional demo accounts come from the auth mock.
const cartButton = (page: Page) => page.getByRole('banner').getByRole('button', { name: /cart/i });

async function signIn(page: Page, email: string, password: string) {
  await page.getByLabel(/^email/i).fill(email);
  await page.getByLabel(/^password/i).fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
}

test('a guest buys through the simulated checkout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/en/products/peru-85-dark-bar');
  await page
    .getByRole('button', { name: /add to cart/i })
    .first()
    .click();
  await expect(cartButton(page)).toHaveAccessibleName('Open cart. Items: 1');
  await page.goto('/en/checkout');
  await expect(page.getByText('Demo order — no payment collected')).toBeVisible();
  await page.getByLabel(/^email/i).fill('guest@solcacao.test');
  await page.getByLabel(/^full name/i).fill('Demo Guest');
  await page.getByLabel(/^address line 1/i).fill('1 Cacao Lane');
  await page.getByLabel(/^city/i).fill('Austin');
  await page.getByLabel(/^state, province or region/i).fill('TX');
  await page.getByLabel(/^postal code/i).fill('78701');
  await page.getByRole('button', { name: 'Place demo order' }).click();
  await expect(page).toHaveURL(/\/en\/order-confirmation$/);
  await expect(
    page.getByRole('heading', { name: 'Thank you — demo order received' }),
  ).toBeVisible();
  // The total is recalculated from catalog prices, never sent by the browser.
  await expect(page.getByText('$9.99')).toBeVisible();
  await expect(cartButton(page)).toHaveAccessibleName('Open cart. Items: 0');
  expect(errors).toEqual([]);
});

test('signing in keeps the guest cart; signing out clears it', async ({ page }) => {
  await page.goto('/en/catalog');
  await page
    .getByRole('button', { name: /^add to cart/i })
    .first()
    .click();
  await expect(cartButton(page)).toHaveAccessibleName('Open cart. Items: 1');
  await page.goto('/en/login');
  await signIn(page, 'retail@solcacao.test', 'retail-demo-pass');
  await expect(page).toHaveURL(/\/en\/account$/);
  await expect(cartButton(page)).toHaveAccessibleName('Open cart. Items: 1');
  await page
    .getByRole('banner')
    .getByRole('button', { name: /sign out/i })
    .click();
  await expect(cartButton(page)).toHaveAccessibleName('Open cart. Items: 0');
});

test('a business buyer signs in and sends a quote, switching to Spanish mid-wizard', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/en/wholesale');
  await page.getByRole('link', { name: 'Start your custom quote' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
  await page.getByRole('button', { name: /^sign in$/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/^email/i).fill('business@solcacao.test');
  await dialog.getByLabel(/^password/i).fill('business-demo-pass');
  await dialog.getByRole('button', { name: /^sign in$/i }).click();

  await expect(page.getByRole('heading', { name: 'Cacao and quantity' })).toBeVisible();
  await page.getByLabel(/Dark 70%/).check();
  await page.getByLabel(/^Quantity/).fill('120');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'Branding file' })).toBeVisible();
  await page.locator('input[type=file]').setInputFiles({
    name: 'brand.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n'),
  });
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'Packaging and contact' })).toBeVisible();
  // The signed-in business account pre-fills the company and contact email.
  await expect(page.getByLabel(/^Company name/)).toHaveValue('Fictional Demo Company');
  await page.getByLabel(/^Gift box/).check();
  await page.getByLabel(/^Notes/).fill('Logo on the lid, please.');
  await page.getByRole('banner').getByRole('link', { name: /^ES/ }).click();
  await expect(page).toHaveURL(/\/es\/wholesale\/request$/);
  await expect(page.getByRole('heading', { name: 'Empaque y contacto' })).toBeVisible();
  await expect(page.getByLabel(/^Notas/)).toHaveValue('Logo on the lid, please.');
  await expect(page.getByLabel(/^Caja de regalo/)).toBeChecked();
  await page.getByRole('button', { name: 'Continuar' }).click();

  await expect(page.getByRole('heading', { name: 'Revisar y enviar' })).toBeVisible();
  await page.getByRole('button', { name: 'Enviar solicitud de cotización' }).click();
  await expect(
    page.getByRole('heading', { name: 'Solicitud de demostración completada' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
