import { test, expect, type BrowserContext, type Page } from '@playwright/test';

// Phase 2 shell checks against the mock-mode dev server, across every member's routed pages.
// Cross-feature journeys live in journeys.spec.ts.
const pages = [
  '/en',
  '/es/catalog?category=truffle',
  '/en/products/peru-85-dark-bar',
  '/es/checkout',
  '/en/wholesale',
  '/es/wholesale/request',
  '/en/login',
  '/es/register',
  '/en/contact',
  '/es/sampler',
  '/en/story',
  '/es/care',
  '/es/no-existe',
  '/fr/catalog',
];

// 320px is the WCAG 1.4.10 Reflow width; 375/768/1440 are the design breakpoints.
for (const width of [320, 375, 768, 1440]) {
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

// A larger browser default font (Chrome's "Large" is 20px, "Very large" 24px) scales every rem,
// breakpoints included, so a 375px phone at 20px has the room of 300px at 16px.
async function setBrowserFont(page: Page, context: BrowserContext, size: number) {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Page.setFontSizes', { fontSizes: { standard: size, fixed: 13 } });
}

for (const [fontSize, width] of [
  [18, 320],
  [18, 375],
  [20, 320],
  [20, 375],
  [24, 320],
  [24, 375],
]) {
  test(`no horizontal overflow at ${width}px with a ${fontSize}px browser font`, async ({
    page,
    context,
  }) => {
    await setBrowserFont(page, context, fontSize);
    await page.setViewportSize({ width, height: 900 });
    for (const path of pages) {
      await page.goto(path);
      await expect(page.getByRole('contentinfo')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `${path} at ${width}px, ${fontSize}px font`).toBeLessThanOrEqual(0);
    }
  });
}

test('below 20rem the header keeps menu, wordmark and cart, and the drawer has the rest', async ({
  page,
  context,
}) => {
  await setBrowserFont(page, context, 24);
  await page.setViewportSize({ width: 320, height: 812 });
  await page.goto('/es/catalog');
  const header = page.getByRole('banner');
  for (const control of [
    header.getByRole('button', { name: 'Abrir menú' }),
    header.getByRole('link', { name: 'Inicio de SolCacao' }),
    header.getByRole('button', { name: /^Abrir carrito/ }),
  ]) {
    await expect(control).toBeInViewport({ ratio: 1 });
  }
  await expect(header.getByRole('button', { name: 'Abrir búsqueda' })).toBeHidden();
  await expect(header.getByRole('link', { name: 'Iniciar sesión' })).toBeHidden();

  await header.getByRole('button', { name: 'Abrir menú' }).click();
  const drawer = page.getByRole('dialog', { name: 'Menú' });
  const search = drawer.getByRole('searchbox', { name: 'Buscar chocolates' });
  await expect(search).toBeVisible();
  // The search button wraps below rather than squeezing the field (it was 40px wide).
  expect((await search.boundingBox())?.width).toBeGreaterThan(160);
  await expect(drawer.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible();
});

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
