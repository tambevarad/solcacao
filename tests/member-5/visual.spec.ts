import { expect, test } from '@playwright/test';

for (const width of [375, 768, 1440]) {
  test(`support pages fit ${width}px in EN and ES`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const locale of ['en', 'es']) {
      for (const route of ['contact', 'feedback', 'sampler', 'story', 'care']) {
        await page.goto(`/${locale}/${route}`);
        await expect(page.locator('main h1')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        if (route === 'sampler') await expect(page.locator('main article').first()).toBeVisible();
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
