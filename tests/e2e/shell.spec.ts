import { test, expect } from '@playwright/test';

// Phase 2 shell checks against the mock-mode dev server. Feature pages are still placeholders, so
// these assert shell behavior only; owners add their own journeys.
const pages = [
  '/en',
  '/es/catalog?category=truffle',
  '/en/products/fixture-bar-1',
  '/es/wholesale/request',
  '/en/contact',
  '/es/no-existe',
  '/fr/catalog',
];

for (const width of [375, 768, 1440]) {
  test(`no horizontal overflow at ${width}px in EN and ES`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of pages) {
      await page.goto(path);
      await expect(page.getByRole('contentinfo')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0);
    }
  });
}

test('mobile drawer is keyboard operable and traps focus', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/en/catalog');
  const opener = page.getByRole('button', { name: 'Open menu' });
  await opener.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Menu' });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press(i % 7 === 6 ? 'Shift+Tab' : 'Tab');
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  }
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('language switch keeps path and query, and deep links survive reload', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/en/catalog?category=truffle');
  await page.getByRole('banner').getByRole('link', { name: 'ES (Español)', exact: true }).click();
  await expect(page).toHaveURL('/es/catalog?category=truffle');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page).toHaveTitle('Comprar chocolate · SolCacao');
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL('/en/catalog?category=truffle');
});

test('header search submits a localized catalog query', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/es/story');
  await page.getByRole('button', { name: 'Abrir búsqueda' }).click();
  await page.getByRole('searchbox', { name: 'Buscar chocolates' }).fill('cacao 70%');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/es/catalog?search=cacao+70%25');
});

test('unknown routes and prefixes render not-found inside the shell', async ({ page }) => {
  await page.goto('/en/not-a-page');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('banner')).toBeVisible();
  await page.goto('/fr/catalog');
  await expect(page.getByRole('main').getByRole('link', { name: 'Español' })).toHaveAttribute(
    'href',
    '/es',
  );
});
