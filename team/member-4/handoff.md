# Student 4 handoff

Current phases: 3 and 4 together (decision D22, second turn), on `krish-b2b`. Evidence:
`team/member-4/phase-3-evidence.md` and `phase-4-evidence.md`. Notes and known limits:
`client/src/features/b2b/README.md` and `server/src/features/b2b/README.md`.

## Public exports delivered

- **Pages** (paths and default exports unchanged): `HomePage`, `WholesalePage`, `QuoteWizardPage`.
  Each takes an optional test seam; the app passes none.
- **Client adapters:** `createMockB2B(http, options?)` and `createHttpB2B(http)`, both `B2bApi`.
- **Server:** `b2bRouter` (mounted by `app.ts`), `createB2bRouter(deps)`, the `B2bRequest` model and
  `createLocalQuoteStorage(root)`.
- **Routes:** `POST /api/b2b/quote`, `GET /api/b2b/quotes/:id`, `GET /api/b2b/quotes/:id/file`
  (unchanged; contractVersion 2).
- **New in this turn, feature-internal:**
  - `quoteDraftStore` / `createQuoteDraftStore` (`client/src/features/b2b/draftStore.ts`);
  - `DeferredPhoto` and `useNearViewport` (`client/src/features/b2b/components/DeferredPhoto.tsx`).
  - Other features should not import them.

## Peer ports used (all published; no peer file was changed)

- **Student 1:**
  - `RequireRole role="b2b"` on the wizard route;
  - `useAuth().user` (prefill and the draft's owner) and `useAuth().logout()`, called after a 401
    so the guard asks for sign-in;
  - `requireAuth` / `requireRole('b2b')` on the server.
  - The one-hour session end (the AuthProvider timer) and the sign-in dialog were exercised against
    the live API. No failure was found.
- **Student 3:** `api.catalog.list` for the featured products, checked against the live API. It
  returned four products from the seeded catalog, and `[]` with `X-Total-Count: 0` from an empty one
  (the empty state shows). No failure was found.
- **Student 5:** `notifyQuote`, checked against the live API.
  - With Mailpit running: the receipt says `sent`, and the email is in the inbox.
  - With Mailpit stopped: the receipt and the record say `failed`, and the quote is kept.
  - No failure was found.
- **Student 2:** production serving, CI and the live-API suite; proposals below.

## Shared change proposals

### 1. Student 2, `tests/e2e/live/journeys.live.spec.ts`: the quote journey for your placeholder

- Replace the `test.fixme` quote line with the test below. It uses only the file's existing helpers
  (`PASSWORD`, `uniqueEmail`, `apiResponse`) and the CI job's Mailpit.
- It was checked in place: a copy of your file with exactly this change ran against the compiled
  API, MongoDB and Mailpit, and passed together with your four journeys (5 passed, the sampler
  placeholder still skipped).
- `git apply --check` passes on `development` at 13a60a2.
- Consumers: CI job `e2e-live` only. Migration: none.

```diff
--- a/tests/e2e/live/journeys.live.spec.ts
+++ b/tests/e2e/live/journeys.live.spec.ts
@@ -122,5 +122,68 @@

 // Journeys of later D22 turns. Student 2 fills them in the closing turn from the owners' handoff
 // proposals, once their PRs have merged.
-test.fixme('a business buyer sends a quote with a PDF and the email reaches Mailpit', () => {});
+test('a business buyer sends a quote with a PDF and the email reaches Mailpit', async ({
+  page,
+  request,
+}) => {
+  const mailpit = process.env.MAILPIT_URL ?? 'http://127.0.0.1:8025';
+  const marker = `quote${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
+  const pdf = {
+    name: `brand-${marker}.pdf`,
+    mimeType: 'application/pdf',
+    buffer: Buffer.from(`%PDF-1.4\n% synthetic live test file ${marker}\n%%EOF\n`),
+  };
+
+  // A business account; then in-app navigation only, because the session lives in memory.
+  await page.goto('/en/register?role=b2b');
+  await page.getByLabel(/^full name/i).fill('Live Test Buyer');
+  await page.getByLabel(/^email/i).fill(uniqueEmail());
+  await page.getByLabel(/^password/i).fill(PASSWORD);
+  await page.getByRole('radio', { name: /^business/i }).check();
+  await page.getByLabel(/^company name/i).fill('Live Test Hotel');
+  const created = apiResponse(page, 'POST', '/api/auth/register');
+  await page.getByRole('button', { name: /^create account$/i }).click();
+  expect((await created).status()).toBe(201);
+  const token: string = (await (await created).json()).data.token;
+  await page
+    .getByRole('navigation', { name: 'Main' })
+    .getByRole('link', { name: 'Wholesale' })
+    .click();
+  await page.getByRole('link', { name: 'Start your custom quote' }).click();
+
+  await page.getByRole('radio', { name: /Dark 70%/ }).check();
+  await page.getByLabel('Quantity (units)').fill('250');
+  await page.getByRole('button', { name: 'Continue' }).click();
+  await page.getByLabel('Branding file (PDF)').setInputFiles(pdf);
+  await page.getByRole('button', { name: 'Continue' }).click();
+  await page.getByRole('radio', { name: /Gift box/ }).check();
+  await page.getByRole('button', { name: 'Continue' }).click();
+  await expect(page.getByRole('form')).toContainText(pdf.name);
+
+  const sent = apiResponse(page, 'POST', '/api/b2b/quote');
+  await page.getByRole('button', { name: 'Send quote request' }).click();
+  const response = await sent;
+  expect(response.status()).toBe(201);
+  expect(await response.request().headerValue('authorization')).toMatch(/^Bearer \S+$/);
+  const receipt = (await response.json()).data;
+  expect(receipt).toMatchObject({ status: 'submitted', notificationStatus: 'sent' });
+  await expect(page.getByRole('heading', { name: 'Quote request received' })).toBeVisible();
+
+  // The private file comes back unchanged to its owner only; the email is in the inbox.
+  const file = await request.get(`/api/b2b/quotes/${receipt.id}/file`, {
+    headers: { Authorization: `Bearer ${token}` },
+  });
+  expect(file.status()).toBe(200);
+  expect(file.headers()['content-disposition']).toBe(`attachment; filename="${pdf.name}"`);
+  expect(Buffer.from(await file.body()).equals(pdf.buffer)).toBe(true);
+  expect((await request.get(`/api/b2b/quotes/${receipt.id}/file`)).status()).toBe(401);
+  await expect
+    .poll(async () => {
+      const found = await request.get(
+        `${mailpit}/api/v1/search?query=${encodeURIComponent(receipt.id)}`,
+      );
+      return found.ok() ? ((await found.json()).messages?.length ?? 0) : 0;
+    })
+    .toBe(1);
+});
 test.fixme('a six-piece sampler enquiry is saved and its email reaches Mailpit', () => {});
```

The longer journeys (lost response, refused session, session expiry, keyboard at 375 px, Mailpit
stopped) stay in `tests/member-4/quote-journey.live.spec.ts`, which runs with its own config.

### 2. Student 2, `client/public/images` (optional): smaller homepage photos

- Lazy loading in this PR already cut the homepage's first-load image bytes. At 375 px on a 3×
  phone it went from 704 KB to 130 KB (phase-4-evidence.md). This proposal covers the bytes that
  remain once the visitor scrolls.
- The files are already compressed WebP, about quality 80. A trial re-encode of the 18 homepage
  files at quality 75 (`cwebp -q 75 -m 6 -sharp_yuv -metadata none`) saved only 10%
  (778 → 702 KB), so it is not worth a second lossy pass. If wanted, re-encode from the CC0
  originals listed in `docs/assets.md` instead.
- The bigger saving is a 768 px size for the three half-width slots (`home-story`, `home-sampler`,
  `home-business`). A 1× desktop at 1440 px wants a 720 px image there and currently gets the
  1024 px file.
  - The trial, using `cwebp -q 75 -resize 768 0`, cut those three files from 241 KB to 119 KB.
  - The change: a third width in `photo()` (`client/src/shared/photos.ts`, for example
    `[640, 768, 1024]`) for those entries only, plus the new files and their `docs/assets.md` rows.
  - Consumers: `<Photo>` only, so no feature code changes.

### 3. Student 2, contract (optional, closing turn): download the PDF from the receipt

- Today `B2bApi` has only `submit`. The owner-only routes exist, but the UI cannot use them, so the
  Phase 4 "protected file retrieval" demo uses the API directly.
- Proposed addition, contractVersion 3:
  - in `contracts/index.ts`: `B2bApi.downloadFile(id: Id): Promise<Blob>`;
  - in `HttpClient`: `requestBlob(path: string): Promise<Blob>`, with the same bearer token and
    `ApiError` on failure, because `request` expects JSON.
- Consumers:
  - `createHttpB2B` calls `requestBlob('/b2b/quotes/' + id + '/file')`;
  - `createMockB2B` returns the in-memory file for a mock receipt;
  - `QuoteReceiptView` gains a "Download your PDF" button in HTTP mode.
  - Student 4 does the feature side once the contract merges.
- Tests: an adapter test for the binary path, and the live spec downloading through the UI.

## Phase 2 proposals: status

- **1 (`tests/member-2` homepage assertions):** done by Student 2 in PR #6.
- **2 (mock B2B e2e journey) and 3 (`.env.example` scenario line):** done by Student 2 in the
  integration PR #12.
- **4 (`docs/context.md` phase wording):** resolved; the current text puts backend work in Phase 2.

## Known limitations and next step

- Live-site checks (Phase 4 step 4) wait on actions only the team can take:
  - a business sign-in on the deployed site, by Krish;
  - a Railway redeploy and the Mailpit inbox password, from Varad.
  - Results are recorded in phase-4-evidence.md as they happen.
- The draft is kept in tab memory only: a reload starts over (and signs out).
- Phase 1 status for member 4 is still `not_started` (D21); member 4 records it truthfully.
