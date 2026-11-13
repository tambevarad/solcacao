import {
  expect,
  request as apiRequest,
  test,
  type APIRequestContext,
  type Locator,
  type Page,
} from '@playwright/test';

// Student 4 Phase 3 journeys against the live API (tests/member-4/playwright.config.ts). Every
// assertion waits for a real /api response, the stored file is downloaded back, and the email is
// looked up in Mailpit's inbox, so none of this can pass against mock adapters.
// With Mailpit stopped (docker compose stop mailpit), run with EXPECT_NOTIFICATION=failed to check
// the failed-notification outcome; the journeys that count emails are skipped then.

const PASSWORD = 'live-quote-password-123';
const MAILPIT = process.env.MAILPIT_URL ?? 'http://127.0.0.1:8025';
const mailpitDown = process.env.EXPECT_NOTIFICATION === 'failed';

const unique = () => `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
const pdf = (marker: string) => ({
  name: `brand-${marker}.pdf`,
  mimeType: 'application/pdf',
  buffer: Buffer.from(`%PDF-1.4\n% synthetic live test file ${marker}\n%%EOF\n`),
});
const quoteResponse = (page: Page) =>
  page.waitForResponse(
    (r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/b2b/quote',
  );

// Accounts are created once through the API (registration is limited to 10 per hour per address);
// every journey then signs in through the real sign-in page.
const buyer = { email: '', token: '' };
const others = { business: '', retail: '' };

async function register(request: APIRequestContext, email: string, role: 'b2b' | 'retail') {
  const response = await request.post('/api/auth/register', {
    data: {
      name: role === 'b2b' ? 'Live Quote Buyer' : 'Live Retail Shopper',
      email,
      password: PASSWORD,
      role,
      ...(role === 'b2b' ? { companyName: 'Live Test Hotel' } : {}),
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).data.token as string;
}

test.beforeAll(async () => {
  const request = await apiRequest.newContext({
    baseURL: process.env.LIVE_BASE_URL ?? 'http://127.0.0.1:4000',
  });
  buyer.email = `quote-${unique()}@example.test`;
  buyer.token = await register(request, buyer.email, 'b2b');
  others.business = await register(request, `other-${unique()}@example.test`, 'b2b');
  others.retail = await register(request, `retail-${unique()}@example.test`, 'retail');
  await request.dispose();
});

/** Signs the business buyer in through the sign-in page. */
async function signIn(page: Page) {
  await page.goto('/en/login');
  await page.getByLabel(/^email/i).fill(buyer.email);
  await page.getByLabel(/^password/i).fill(PASSWORD);
  const login = page.waitForResponse((r) => new URL(r.url()).pathname === '/api/auth/login');
  await page
    .getByRole('main')
    .getByRole('button', { name: /^sign in$/i })
    .click();
  expect((await login).status()).toBe(200);
  await expect(page).toHaveURL(/\/en\/account$/);
}

/** Signs in again from the guard's dialog, staying on the wizard's address. */
async function signInFromDialog(page: Page) {
  await page.getByRole('main').getByRole('button', { name: 'Sign in' }).click();
  const dialog = page.getByRole('dialog', { name: 'Sign in' });
  await dialog.getByLabel(/^email/i).fill(buyer.email);
  await dialog.getByLabel(/^password/i).fill(PASSWORD);
  await dialog.getByRole('button', { name: 'Sign in' }).click();
}

async function stepOneAndTwo(page: Page, file: ReturnType<typeof pdf>) {
  // In-app navigation only: the session lives in memory, so a full page load would sign out.
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Wholesale' })
    .click();
  await page.getByRole('link', { name: 'Start your custom quote' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Cacao and quantity' })).toBeVisible();
  await page.getByRole('radio', { name: /Dark 70%/ }).check();
  await page.getByLabel('Quantity (units)').fill('250');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Branding file (PDF)').setInputFiles(file);
  await expect(page.getByTestId('selected-file')).toContainText(file.name);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Packaging and contact' }),
  ).toBeVisible();
}

async function toReview(page: Page, file: ReturnType<typeof pdf>, notes: string) {
  await stepOneAndTwo(page, file);
  await page.getByRole('radio', { name: /Gift box/ }).check();
  await expect(page.getByLabel('Company name')).toHaveValue('Live Test Hotel');
  await page.getByLabel('Notes (optional)').fill(notes);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Review and send' })).toBeVisible();
}

async function mailpitMessages(request: APIRequestContext, query: string) {
  const response = await request.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(query)}`);
  return response.ok() ? ((await response.json()).messages ?? []) : [];
}

async function download(request: APIRequestContext, id: string, token?: string) {
  return request.get(`/api/b2b/quotes/${id}/file`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/** Presses Tab until `target` has focus (keyboard-only navigation, no clicks). */
async function tabTo(page: Page, target: Locator) {
  for (let i = 0; i < 40; i++) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Could not reach the control with the keyboard');
}

const noHorizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test('a business buyer sends a quote with a PDF; the saved request, file and email match', async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await signIn(page);
  const marker = unique();
  const file = pdf(marker);
  await stepOneAndTwo(page, file);
  await page.getByRole('radio', { name: /Gift box/ }).check();
  await page.getByLabel('Notes (optional)').fill(`Live journey ${marker}`);

  // Switch to Spanish at step 3: step, answers and the in-memory file stay.
  await page.getByRole('link', { name: 'ES (Español)' }).first().click();
  await expect(page).toHaveURL(/\/es\/wholesale\/request$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Empaque y contacto' })).toBeVisible();
  await expect(page.getByLabel('Nombre de la empresa')).toHaveValue('Live Test Hotel');
  await page.getByRole('button', { name: 'Continuar' }).click();
  const review = page.getByRole('form');
  await expect(review).toContainText('250 unidades');
  await expect(review).toContainText(file.name);
  await expect(review).toContainText(`Live journey ${marker}`);

  const sent = quoteResponse(page);
  await page.getByRole('button', { name: 'Enviar solicitud de cotización' }).click();
  const response = await sent;
  expect(response.status()).toBe(201);
  expect(await response.request().headerValue('authorization')).toMatch(/^Bearer \S+$/);
  const receipt = (await response.json()).data;
  const expected = mailpitDown ? 'failed' : 'sent';
  expect(receipt).toMatchObject({ status: 'submitted', notificationStatus: expected });

  await expect(
    page.getByRole('heading', { name: 'Solicitud de cotización recibida' }),
  ).toBeVisible();
  await expect(page.getByText(receipt.id)).toBeVisible();
  await expect(page.locator('dt:text-is("Notificación por correo") + dd')).toHaveText(
    mailpitDown ? 'Falló' : 'Enviada',
  );
  if (mailpitDown) await expect(page.getByText(/No necesitas enviar la solicitud/)).toBeVisible();

  // The saved quote stays discoverable by its owner, with the truthful notification status.
  const own = await request.get(`/api/b2b/quotes/${receipt.id}`, {
    headers: { Authorization: `Bearer ${buyer.token}` },
  });
  expect(own.status()).toBe(200);
  expect((await own.json()).data).toEqual(receipt);

  // The stored file is exactly the uploaded one, as an attachment, to its owner only.
  const file200 = await download(request, receipt.id, buyer.token);
  expect(file200.status()).toBe(200);
  expect(file200.headers()['content-type']).toMatch(/^application\/pdf/);
  expect(file200.headers()['content-disposition']).toBe(`attachment; filename="${file.name}"`);
  expect(file200.headers()['x-content-type-options']).toBe('nosniff');
  expect(Buffer.from(await file200.body()).equals(file.buffer)).toBe(true);
  expect((await download(request, receipt.id)).status()).toBe(401);
  expect((await download(request, receipt.id, others.business)).status()).toBe(404);
  expect((await download(request, receipt.id, others.retail)).status()).toBe(403);

  if (!mailpitDown) {
    await expect.poll(async () => (await mailpitMessages(request, receipt.id)).length).toBe(1);
    const [message] = await mailpitMessages(request, receipt.id);
    expect(message.Subject).toBe('SolCacao: consulta mayorista');
  }
  expect(errors).toEqual([]);
});

test('an upload rejection and a lost response keep the draft; the retry is not a duplicate', async ({
  page,
  request,
}) => {
  test.skip(mailpitDown, 'counts emails in Mailpit');
  await signIn(page);
  const marker = unique();
  await toReview(page, pdf(marker), `Retry journey ${marker}`);

  // 1. The server refuses the file: back to step 2 with the reason; everything else is kept.
  await page.route('**/api/b2b/quote', (route) =>
    route.fulfill({
      status: 415,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'UNSUPPORTED_FILE', message: 'Unsupported file' } }),
    }),
  );
  await page.getByRole('button', { name: 'Send quote request' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Branding file' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('The file must be a PDF.');
  await page.unroute('**/api/b2b/quote');
  const replacement = pdf(`${marker}-v2`);
  await page.getByLabel(/Replace branding file|Branding file \(PDF\)/).setInputFiles(replacement);
  await expect(page.getByTestId('selected-file')).toContainText(replacement.name);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Review and send' })).toBeVisible();

  // 2. A slow upload whose response is lost: the server saves it, the browser sees a failure.
  let saved: { id: string } | undefined;
  await page.route('**/api/b2b/quote', async (route) => {
    await new Promise((done) => setTimeout(done, 1500));
    const real = await route.fetch();
    saved = (await real.json()).data;
    await route.abort('connectionreset');
  });
  const send = page.getByRole('button', { name: 'Send quote request' });
  await send.click();
  await expect(send).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('button', { name: 'Back' })).toBeDisabled();
  await expect(page.getByText("We couldn't send your request.", { exact: false })).toBeVisible();
  await expect(page.getByText('Your answers and file are still here.')).toBeVisible();
  expect(saved?.id).toMatch(/^[a-f0-9]{24}$/);
  await page.unroute('**/api/b2b/quote');

  // 3. The retry resends the same requestId and file: the original receipt, no second quote.
  const retried = quoteResponse(page);
  await page.getByRole('button', { name: 'Try sending again' }).click();
  const response = await retried;
  expect(response.status()).toBe(201);
  const receipt = (await response.json()).data;
  expect(receipt.id).toBe(saved?.id);
  await expect(page.getByRole('heading', { name: 'Quote request received' })).toBeVisible();
  await expect.poll(async () => (await mailpitMessages(request, receipt.id)).length).toBe(1);
  await page.waitForTimeout(1000);
  expect(await mailpitMessages(request, receipt.id)).toHaveLength(1);
});

test('a refused session asks for sign-in and keeps the draft, file and attempt', async ({
  page,
}) => {
  await signIn(page);
  const marker = unique();
  const file = pdf(marker);
  await toReview(page, file, `Session journey ${marker}`);

  // The server refuses the token (as for an expired session); nothing is saved.
  await page.route('**/api/b2b/quote', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }),
    }),
  );
  await page.getByRole('button', { name: 'Send quote request' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in to continue' })).toBeVisible();
  await page.unroute('**/api/b2b/quote');

  await signInFromDialog(page);

  await expect(page.getByRole('heading', { level: 2, name: 'Review and send' })).toBeVisible();
  await expect(
    page.getByText(/Your earlier answers in this browser tab are still here/),
  ).toBeVisible();
  await expect(page.getByRole('form')).toContainText(file.name);
  const sent = quoteResponse(page);
  await page.getByRole('button', { name: 'Send quote request' }).click();
  expect((await sent).status()).toBe(201);
  await expect(page.getByRole('heading', { name: 'Quote request received' })).toBeVisible();
});

test('when the one-hour session ends mid-draft, signing in again brings the draft back', async ({
  page,
}) => {
  await page.clock.install();
  await signIn(page);
  const marker = unique();
  const file = pdf(marker);
  await toReview(page, file, `Expiry journey ${marker}`);

  // Student 1's AuthProvider signs out at expiresAt; RequireRole then replaces the wizard.
  await page.clock.fastForward('01:00:05');
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in to continue' })).toBeVisible();
  // The server's clock did not move, so put the page's clock back before the new session starts.
  await page.clock.setSystemTime(new Date());

  await signInFromDialog(page);

  await expect(page.getByRole('heading', { level: 2, name: 'Review and send' })).toBeVisible();
  await expect(page.getByRole('form')).toContainText(file.name);
  await expect(page.getByRole('form')).toContainText(`Expiry journey ${marker}`);
  const sent = quoteResponse(page);
  await page.getByRole('button', { name: 'Send quote request' }).click();
  expect((await sent).status()).toBe(201);
});

test('all four steps work at 375 px with the keyboard only, in Spanish', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await page.setViewportSize({ width: 375, height: 812 });
  await signIn(page);
  // In-app navigation only (a full page load would sign out): Spanish, then the footer link.
  await page.getByRole('link', { name: 'ES (Español)' }).first().click();
  await expect(page).toHaveURL(/\/es\/account$/);
  await page
    .getByRole('contentinfo')
    .getByRole('link', { name: 'Solicitar una cotización personalizada' })
    .click();
  await expect(page.getByRole('heading', { level: 2, name: 'Cacao y cantidad' })).toBeVisible();
  expect(await noHorizontalOverflow(page)).toBe(true);

  // Step 1: a radio group (arrow keys) and a number, then Enter submits the step.
  await tabTo(page, page.getByRole('radio').first());
  await page.keyboard.press('Space');
  await expect(page.getByRole('radio').first()).toBeChecked();
  await tabTo(page, page.getByLabel('Cantidad (unidades)'));
  await page.keyboard.type('300');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 2, name: 'Archivo de marca' })).toBeFocused();
  expect(await noHorizontalOverflow(page)).toBe(true);

  // Step 2: open the file chooser from the keyboard.
  const fileInput = page.getByLabel('Archivo de marca (PDF)');
  await tabTo(page, fileInput);
  const chooser = page.waitForEvent('filechooser');
  await page.keyboard.press('Space');
  const file = pdf(unique());
  await (await chooser).setFiles(file);
  await expect(page.getByTestId('selected-file')).toContainText(file.name);
  await tabTo(page, page.getByRole('button', { name: 'Continuar' }));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 2, name: 'Empaque y contacto' })).toBeFocused();
  expect(await noHorizontalOverflow(page)).toBe(true);

  // Step 3: the first packaging option, then arrow to the next one.
  await tabTo(page, page.getByRole('radio', { name: /^Faja/ }));
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio', { name: /^Caja de regalo/ })).toBeChecked();
  await tabTo(page, page.getByRole('button', { name: 'Continuar' }));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 2, name: 'Revisar y enviar' })).toBeFocused();
  expect(await noHorizontalOverflow(page)).toBe(true);

  // Step 4: send with Enter.
  const sent = quoteResponse(page);
  await tabTo(page, page.getByRole('button', { name: 'Enviar solicitud de cotización' }));
  await page.keyboard.press('Enter');
  expect((await sent).status()).toBe(201);
  await expect(
    page.getByRole('heading', { name: 'Solicitud de cotización recibida' }),
  ).toBeFocused();
  expect(await noHorizontalOverflow(page)).toBe(true);
  expect(errors).toEqual([]);
});
