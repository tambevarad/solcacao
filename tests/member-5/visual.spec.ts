import { expect, test } from '@playwright/test';

for (const width of [375, 768, 1440]) {
  test(`shop and support pages fit ${width}px in EN and ES`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const locale of ['en', 'es']) {
      for (const route of ['catalog', 'contact', 'feedback', 'sampler', 'story', 'care']) {
        await page.goto(`/${locale}/${route}`);
        await expect(page.locator('main h1')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        if (route === 'sampler') {
          const cards = page.locator('main article');
          await expect(cards.first()).toBeVisible();
          const positions = await cards.evaluateAll((elements) =>
            elements.slice(0, 2).map((element) => {
              const { x, y } = element.getBoundingClientRect();
              return { x, y };
            }),
          );
          expect(positions).toHaveLength(2);
          expect(positions[0].y).toBe(positions[1].y);
          expect(positions[1].x).toBeGreaterThan(positions[0].x);
          for (const button of await cards.first().locator('button').all()) {
            const size = await button.boundingBox();
            expect(size?.width ?? 0).toBeGreaterThanOrEqual(44);
            expect(size?.height ?? 0).toBeGreaterThanOrEqual(44);
          }
          if (width < 640) await expect(cards.first().locator('p')).toBeHidden();
          else await expect(cards.first().locator('p')).toBeVisible();
        }
        if (route === 'story' || route === 'care') {
          await expect(page.locator('main article section')).toHaveCount(2);
          await expect(page.locator('main')).not.toContainText(
            /being prepared|has not yet been supplied|Estamos preparando|no se ha proporcionado/,
          );
        }
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);
        await expect(page.locator('main')).not.toContainText('⟦support.');
        if (locale === 'en' && (route === 'contact' || route === 'sampler'))
          await page.screenshot({ path: `test-results/member-5-${route}-${width}.png` });
      }
    }
    await page.screenshot({ path: `test-results/member-5-care-${width}.png`, fullPage: true });
  });
}

test('keyboard submission, failure recovery and locale state retention', async ({ page }) => {
  await page.goto('/en/contact');
  await page.getByLabel('Name', { exact: false }).focus();
  await page.keyboard.type('Synthetic Shopper');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Email', { exact: false })).toBeFocused();
  await page.keyboard.type('shopper@example.test');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Message', { exact: false })).toBeFocused();
  await page.keyboard.type('A fictional support question.');
  await page.getByRole('button', { name: 'Demo: fail the next submission' }).focus();
  await page.keyboard.press('Enter');
  const send = page.getByRole('button', { name: 'Send enquiry', exact: true });
  await send.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('alert')).toContainText('Your entries are still here');
  await expect(page.getByLabel('Name', { exact: false })).toHaveValue('Synthetic Shopper');
  await page
    .getByRole('link', { name: /español/i })
    .first()
    .focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/es\/contact/);
  await expect(page.getByLabel('Nombre', { exact: false })).toHaveValue('Synthetic Shopper');
  await page.getByRole('button', { name: 'Enviar consulta', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Consulta recibida' })).toBeVisible();
});

for (const locale of ['en', 'es']) {
  test(`retail quantity picker adds the selected amount in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(`/${locale}/catalog`);
    const quantities = page.getByRole('spinbutton', { name: /^(Quantity of|Cantidad de) / });
    await expect(quantities.first()).toBeVisible();
    let selected = quantities.first();
    for (const quantity of await quantities.all()) {
      if (Number(await quantity.getAttribute('max')) >= 3) {
        selected = quantity;
        break;
      }
    }
    await selected.fill('3');
    await selected.press('Tab');
    const card = selected.locator('xpath=ancestor::li[1]');
    await expect(
      card.getByRole('button', { name: /^(Add to cart:|Añadir al carrito:)/ }),
    ).toBeEnabled();
    await page.screenshot({ path: `test-results/member-5-retail-quantity-${locale}.png` });
    await card.getByRole('button', { name: /^(Add to cart:|Añadir al carrito:)/ }).click();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const saved = JSON.parse(localStorage.getItem('solcacao.guestCart.v1') || '{"items":[]}');
          return saved.items.some((item: { quantity: number }) => item.quantity === 3);
        }),
      )
      .toBe(true);
    await expect(selected).toHaveValue('1');
  });
}

test('sampler uses the real mock catalog to submit six pieces', async ({ page }) => {
  await page.goto('/en/sampler');
  const add = page.getByRole('button', { name: /^Add one / }).first();
  await expect(add).toBeVisible();
  for (let count = 0; count < 6; count++) await add.click();
  await expect(page.getByText('6 of 6 pieces selected')).toBeVisible();
  await expect(add).toBeDisabled();
  await page.getByLabel('Name', { exact: false }).fill('Synthetic Shopper');
  await page.getByLabel('Email', { exact: false }).fill('shopper@example.test');
  await page.getByLabel('Message', { exact: false }).fill('A fictional sampler enquiry.');
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Enquiry received' })).toBeVisible();
  await expect(page.getByText(/Demo receipt only/)).toBeVisible();
});
