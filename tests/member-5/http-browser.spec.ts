import { expect, test } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { InquiryInput, Product } from '../../contracts/index.js';

const apiOrigin = 'http://127.0.0.1:4015';
test.describe.configure({ mode: 'serial' });
test.afterAll(async () => {
  await promisify(execFile)('docker', ['compose', 'start', 'mailpit']);
});

for (const width of [375, 768, 1440]) {
  test(`real HTTP pages wrap, translate and expose keyboard controls at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const locale of ['en', 'es']) {
      for (const route of ['contact', 'feedback', 'sampler']) {
        await page.goto(`/${locale}/${route}`);
        await expect(page.locator('main h1')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.locator('main')).not.toContainText('⟦support.');
        await expect(page.getByText(/Demo form:|Formulario de demostración:/)).toHaveCount(0);
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
          for (const button of [add, remove]) {
            const box = await button.boundingBox();
            expect(box?.width).toBeGreaterThanOrEqual(44);
            expect(box?.height).toBeGreaterThanOrEqual(44);
          }
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
      }
    }
    await page.screenshot({
      path: `test-results/member-5-phase3-forms-${width}.png`,
      fullPage: true,
    });
  });
}

test('real sampler recovers a lost response with one saved inquiry and one correct email', async ({
  page,
  request,
}) => {
  await page.goto('/en/sampler');
  const catalog = await request.get(`${apiOrigin}/api/products?limit=48`);
  const products: Product[] = await catalog.json();
  const add = page.getByRole('button', { name: /^Add one / }).first();
  await expect(add).toBeVisible();
  for (let count = 0; count < 6; count++) await add.click();
  await page.getByLabel('Name', { exact: false }).fill('Synthetic Shopper');
  await page.getByLabel('Email', { exact: false }).fill('shopper@example.test');
  await page.getByLabel('Message', { exact: false }).fill('A fictional HTTP sampler enquiry.');
  let submitted: InquiryInput | undefined;
  await page.route(
    '**/api/inquiries',
    async (route) => {
      submitted = route.request().postDataJSON();
      await route.fetch(); // Save and notify normally, then simulate losing only the response.
      await route.abort('failed');
    },
    { times: 1 },
  );
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click();
  await expect(page.getByRole('alert')).toBeFocused();
  await expect(page.getByLabel('Name', { exact: false })).toHaveValue('Synthetic Shopper');
  if (!submitted) throw new Error('No real inquiry submitted');
  const requestId = submitted.requestId;
  const first = await (await request.get(`${apiOrigin}/__test/inquiries/${requestId}`)).json();
  expect(first.count).toBe(1);
  const retry = page.waitForRequest(
    (req) => req.url().endsWith('/api/inquiries') && req.method() === 'POST',
  );
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click();
  expect((await retry).postDataJSON().requestId).toBe(requestId);
  await expect(page.getByText('Your enquiry has been saved.', { exact: true })).toBeVisible();
  await expect(page.getByText('The enquiry notification was sent.', { exact: true })).toBeVisible();
  const saved = await (await request.get(`${apiOrigin}/__test/inquiries/${requestId}`)).json();
  expect(saved.count).toBe(1);
  expect(saved.id).toBe(first.id);
  const mails: string[] = await (await request.get(`${apiOrigin}/__test/mail`)).json();
  const matching = mails.filter((mail) => mail.includes(saved.id));
  expect(matching).toHaveLength(1);
  for (const item of saved.samplerItems) {
    const product = products.find((candidate) => candidate.id === item.productId);
    expect(product).toBeTruthy();
    expect(item.name.en).toBe(product?.name.en);
    expect(matching[0]).toContain(`6 × ${product?.name.en} (${item.productId})`);
  }
  await page.screenshot({ path: 'test-results/member-5-phase3-sampler-saved.png', fullPage: true });
});

test('timeout after a real save allows one unchanged retry and blocks duplicate pending submits', async ({
  page,
  request,
}) => {
  test.setTimeout(45000);
  await page.goto('/en/contact');
  await page.getByLabel('Name', { exact: false }).fill('Synthetic Shopper');
  await page.getByLabel('Email', { exact: false }).fill('shopper@example.test');
  await page.getByLabel('Message', { exact: false }).fill('A fictional timeout recovery enquiry.');
  let original: InquiryInput | undefined;
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    '**/api/inquiries',
    async (route) => {
      original = route.request().postDataJSON();
      const response = await route.fetch(); // Real Express save and Mailpit delivery.
      await held; // Lose the timely response without replacing the backend.
      await route.fulfill({ response });
    },
    { times: 1 },
  );
  const send = page.getByRole('button', { name: 'Send enquiry', exact: true });
  await send.click();
  await expect(page.locator('#support-form')).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('button', { name: 'Sending…', exact: true })).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('may already be saved', { timeout: 25000 });
  await expect(page.getByLabel('Message', { exact: false })).toHaveValue(
    'A fictional timeout recovery enquiry.',
  );
  if (!original) throw new Error('No inquiry request captured');
  const savedRequest = original;
  const retry = page.waitForRequest(
    (req) => req.url().endsWith('/api/inquiries') && req.method() === 'POST',
  );
  await send.click();
  expect((await retry).postDataJSON().requestId).toBe(savedRequest.requestId);
  await expect(page.getByText('Your enquiry has been saved.', { exact: true })).toBeVisible();
  release?.();
  const record = await (
    await request.get(`${apiOrigin}/__test/inquiries/${savedRequest.requestId}`)
  ).json();
  expect(record.count).toBe(1);
  const mails: string[] = await (await request.get(`${apiOrigin}/__test/mail`)).json();
  expect(mails.filter((mail) => mail.includes(record.id))).toHaveLength(1);
});

test('backend field errors retain the original draft for an unchanged successful retry', async ({
  page,
}) => {
  await page.goto('/en/contact');
  await page.getByLabel('Name', { exact: false }).fill('Synthetic Shopper');
  await page.getByLabel('Email', { exact: false }).fill('shopper@example.test');
  await page
    .getByLabel('Message', { exact: false })
    .fill('A fictional validation recovery enquiry.');
  let requestId: string | undefined;
  await page.route(
    '**/api/inquiries',
    async (route) => {
      const original = route.request().postDataJSON();
      requestId = original.requestId;
      await route.continue({ postData: JSON.stringify({ ...original, message: 'short' }) });
    },
    { times: 1 },
  );
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('between 10 and 2,000 characters');
  await expect(page.getByLabel('Message', { exact: false })).toHaveValue(
    'A fictional validation recovery enquiry.',
  );
  const retry = page.waitForRequest(
    (req) => req.url().endsWith('/api/inquiries') && req.method() === 'POST',
  );
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click();
  expect((await retry).postDataJSON().requestId).toBe(requestId);
  await expect(page.getByText('Your enquiry has been saved.', { exact: true })).toBeVisible();
});

test('contact and Spanish feedback save through HTTP and show SMTP outage truthfully', async ({
  page,
  request,
}) => {
  await page.goto('/en/contact');
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click();
  await expect(page.getByRole('alert')).toBeFocused();
  await page.getByLabel('Name', { exact: false }).fill('Synthetic Shopper');
  await page.getByLabel('Email', { exact: false }).fill('shopper@example.test');
  await page.getByLabel('Message', { exact: false }).fill('A fictional HTTP contact enquiry.');
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click();
  await expect(page.getByText('Your enquiry has been saved.', { exact: true })).toBeVisible();
  await expect(page.getByText('The enquiry notification was sent.', { exact: true })).toBeVisible();
  expect((await request.post(`${apiOrigin}/__test/stop-smtp`)).status()).toBe(204);
  await page.goto('/es/feedback');
  await page.getByLabel('Nombre', { exact: false }).fill('Cliente ficticio');
  await page.getByLabel('Correo', { exact: false }).fill('cliente@example.test');
  await page.getByLabel('Mensaje', { exact: false }).fill('Una consulta ficticia de integración.');
  const response = page.waitForResponse(
    (res) => res.url().endsWith('/api/inquiries') && res.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Enviar consulta', exact: true }).click();
  const receipt = (await (await response).json()).data;
  expect(receipt.notificationStatus).toBe('failed');
  await expect(page.getByText('Tu consulta se ha guardado.', { exact: true })).toBeVisible();
  await expect(page.getByText(/Tu consulta está guardada, pero no se pudo enviar/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar consulta', exact: true })).toHaveCount(0);
  await page.screenshot({
    path: 'test-results/member-5-phase3-feedback-smtp-failed.png',
    fullPage: true,
  });
});

test('real 429 responses retain entries and the retry request ID', async ({ page, request }) => {
  // Exercise the real public limiter. Invalid bodies consume its budget without creating mail.
  let limited = false;
  for (let attempt = 0; attempt < 21; attempt++) {
    const response = await request.post(`${apiOrigin}/api/inquiries`, { data: {} });
    if (response.status() === 429) {
      limited = true;
      break;
    }
    expect(response.status()).toBe(400);
  }
  expect(limited).toBe(true);
  await page.goto('/en/contact');
  await page.getByLabel('Name', { exact: false }).fill('Synthetic Shopper');
  await page.getByLabel('Email', { exact: false }).fill('shopper@example.test');
  await page.getByLabel('Message', { exact: false }).fill('A fictional throttled enquiry.');
  const firstRequest = page.waitForRequest(
    (req) => req.url().endsWith('/api/inquiries') && req.method() === 'POST',
  );
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click();
  const original = (await firstRequest).postDataJSON();
  await expect(page.getByRole('alert')).toContainText('Too many enquiries');
  await expect(page.getByLabel('Message', { exact: false })).toHaveValue(
    'A fictional throttled enquiry.',
  );
  const retry = page.waitForRequest(
    (req) => req.url().endsWith('/api/inquiries') && req.method() === 'POST',
  );
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click();
  expect((await retry).postDataJSON().requestId).toBe(original.requestId);
  await expect(page.getByRole('alert')).toBeFocused();
});
