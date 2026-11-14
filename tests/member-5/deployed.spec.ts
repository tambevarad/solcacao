import { expect, test } from '@playwright/test';
import type { InquiryReceipt } from '../../contracts/index.js';

const inbox = 'https://mailpit-production-29902785.up.railway.app';

for (const width of [375, 768, 1440]) {
  test(`deployed support pages, keyboard and EN/ES at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.setViewportSize({ width, height: 900 });
    for (const locale of ['en', 'es']) {
      for (const route of ['contact', 'feedback', 'sampler', 'story', 'care']) {
        const response = await page.goto(`/${locale}/${route}`);
        expect(response?.status()).toBe(200);
        await expect(page.locator('main h1')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.locator('main')).not.toContainText('⟦');
        await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        if (route === 'contact' || route === 'feedback') {
          const name = page.locator('#support-name');
          await name.focus();
          await page.keyboard.press('Tab');
          await expect(page.locator('#support-email')).toBeFocused();
          await page.keyboard.press('Tab');
          await expect(page.locator('#support-message')).toBeFocused();
        }
        if (route === 'sampler') {
          const add = page
            .getByRole('button', { name: /^(Add one |Añadir una pieza de )/ })
            .first();
          await expect(add).toBeVisible();
          await add.focus();
          await page.keyboard.press('Enter');
          const remove = page
            .getByRole('button', { name: /^(Remove one |Quitar una pieza de )/ })
            .first();
          await expect(remove).toBeEnabled();
          const box = await add.boundingBox();
          expect(box?.height).toBeGreaterThanOrEqual(44);
          expect(box?.width).toBeGreaterThanOrEqual(44);
        }
      }
    }
    expect(errors).toEqual([]);
    await page.screenshot({ path: `test-results/member-5-deployed-${width}.png`, fullPage: true });
  });
}

for (const locale of ['en', 'es']) {
  test(`deployed ${locale} contact, feedback and sampler arrive in the live inbox`, async ({
    page,
    playwright,
  }) => {
    const user = process.env.MEMBER5_LIVE_MAIL_USER;
    const password = process.env.MEMBER5_LIVE_MAIL_PASSWORD;
    if (!user || !password)
      throw new Error('Live inbox credentials required in ignored local environment');
    const mail = await playwright.request.newContext({
      baseURL: inbox,
      httpCredentials: { username: user, password, send: 'always' },
    });
    try {
      expect((await mail.get('/')).status()).toBe(200);
      for (const route of ['contact', 'feedback', 'sampler']) {
        await page.goto(`/${locale}/${route}`);
        await page.locator('#support-name').fill('Synthetic Member 5 Demo');
        await page.locator('#support-email').fill('member5-demo@example.test');
        const marker = `Synthetic Member 5 ${route} ${locale} ${crypto.randomUUID()}`;
        await page.locator('#support-message').fill(marker);
        if (route === 'sampler') {
          const add = page
            .getByRole('button', { name: /^(Add one |Añadir una pieza de )/ })
            .first();
          await expect(add).toBeVisible();
          for (let piece = 0; piece < 6; piece++) await add.click();
        }
        const response = page.waitForResponse(
          (res) => res.url().endsWith('/api/inquiries') && res.request().method() === 'POST',
        );
        await page.locator('#support-form button[type="submit"]').click();
        const result = await response;
        expect(result.status()).toBe(201);
        const receipt: InquiryReceipt = (await result.json()).data;
        expect(receipt.status).toBe('received');
        expect(receipt.notificationStatus).toBe('sent');
        await expect(page.getByRole('status').filter({ hasText: receipt.id })).toBeVisible();
        await expect
          .poll(
            async () => {
              const listing = await mail.get('/api/v1/messages');
              expect(listing.status()).toBe(200);
              const body: { messages: { ID: string }[] } = await listing.json();
              for (const message of body.messages) {
                const response = await mail.get(
                  `/api/v1/message/${encodeURIComponent(message.ID)}`,
                );
                const payload: { Text: string } = await response.json();
                if (payload.Text.includes(marker) && payload.Text.includes(receipt.id)) return true;
              }
              return false;
            },
            { timeout: 15000 },
          )
          .toBe(true);
        console.log(`Verified deployed ${locale}/${route}: saved receipt and captured live mail`);
      }
    } finally {
      await mail.dispose();
    }
  });
}
