# Student 3 handoff

Current phase: 2 (Core Development), ready for review on `reethika-catalog`. Evidence:
`team/member-3/phase-2-evidence.md`. Phase 1 status is still `not_started` (decision D21).

## Public exports delivered

- **Client cart port** (`client/src/features/catalog/public.tsx`, signatures unchanged):
  `useCart(): CartState` (`items`, `count`, `subtotalCents`, `open`, `setOpen`, `add`, `update`,
  `remove`, `clear`), `CartProvider` (already mounted once in `main.tsx`; optional test-seam props
  `catalog` and `storage`), `CartDrawer` (shared `<Drawer side="right">`).
- **`api.catalog`** in mock mode (default) and HTTP mode: `list`, `get`, `cart`, `persist`,
  `merge`, `checkout`. The homepage's `list({ limit: 4, sort: 'name', locale })` and the sampler's
  `list`/`get` now return the fictional fixture catalog. Fixtures are not exported to other
  features; use `api.catalog`.
- **Server:** `catalogRouter` (already mounted), `createCatalogRouter({ requireAuth, optionalAuth,
isDatabaseReady? })`, `authenticationPending`, `guestOnlyPending`, models in `models.ts`,
  explicit seed `npx tsx server/src/features/catalog/seed.ts`.
- **Port for Student 5:** `getActiveProductsByIds(ids: string[]): Promise<Product[]>` in
  `server/src/features/catalog/service.ts` — deduplicated DTOs (first-seen order) with inventory
  `stock`; malformed, missing and inactive ids are excluded.
- **Pages:** `CatalogPage`, `ProductPage`, `CheckoutPage`, `OrderConfirmationPage` (paths and default
  exports unchanged; each accepts an optional `catalog` test seam).

### Stock adjustment and conflict UX (for reviewers and the demo)

- Sign-in merge: the guest cart is merged once with its `mergeId`; a polite status says it was added,
  or an alert lists each line that was capped by stock ("Eggs: 3 instead of 4") or dropped as
  unavailable. A failed merge keeps the guest cart in storage and offers "Try again".
- Signed-in saves: one request at a time with the latest lines; a `409 CART_CONFLICT` refetches the
  saved cart and asks the shopper to repeat the change; `OUT_OF_STOCK`/unavailable also refetch.
- Adding above stock or 99 caps the quantity and says so. Unavailable lines show "no longer
  available" with Remove, and block checkout.

## Required peer exports and PRs

- **Student 1 (Aman):**
  - Client: `useAuth()` user transitions drive merge/logout; nothing else is needed. The auth mock
    should put `mock:<userId>` in `sessionToken` on sign-in and clear it on sign-out (contract), since
    the catalog mock reads it at call time.
  - Server: `requireAuth` and `optionalAuth` in `server/src/shared/auth.ts` (with the `req.user`
    augmentation), and `connectDb` at startup. After that merges, Student 3 wires them in a follow-up
    PR (own files only) and deletes `server/src/features/catalog/types.ts`:

    ```ts
    import { optionalAuth, requireAuth } from '../../shared/auth.js';
    export const catalogRouter = createCatalogRouter({ requireAuth, optionalAuth });
    ```

  - CI: a MongoDB service exporting `TEST_MONGODB_URI` so `tests/member-3/persistence.test.ts` runs.
- **Student 4 (Krish):** nothing to change in B2B code; see proposal 1c for the one test.
- **Student 5 (Daniel):** call `getActiveProductsByIds` for sampler validation (no model imports);
  `api.catalog.list/get` for the sampler UI.
- **Student 2 (Varad):** proposals 1–6 below.

## Shared change proposals

1. **Stale stub assertions (block `npm run check` on this branch).** The real catalog replaces the
   stubs these tests assert. With this exact patch applied, `tests/health.test.ts`, `tests/member-2`
   and `tests/member-4` all pass (198 passed, 10 Mongo tests skipped). Consumers: tests only;
   migration: none. Please land it with or before this PR.

   a. **Student 1, `tests/health.test.ts`** — `/api/products` now exists (503 without a database):

   ```diff
   -  expect((await request(app).get('/api/products')).status).toBe(404);
   +  expect((await request(app).get('/api/not-a-feature')).status).toBe(404);
   ```

   b. **Student 2, `tests/member-2/shell.test.tsx`** — the cart drawer is real; and the catalog page
   has its own search field, so the "search panel closed" check is scoped to the header (as other
   header assertions in this file already are):

   ```diff
   @@ header search and navigation › submits search … browser back returns
   -    expect(screen.queryByRole('searchbox')).toBeNull();
   +    expect(within(screen.getByRole('banner')).queryByRole('searchbox')).toBeNull();
   @@
   -  it('shows a labeled pending notice instead of crashing while the cart is a stub', async () => {
   +  it('opens the shared cart drawer from the header', async () => {
        renderApp('/en');
        fireEvent.click(await screen.findByRole('button', { name: 'Open cart. Items: 0' }));
   -    // Scoped to the header: feature pages (e.g. the homepage) have their own status regions.
   -    expect(within(screen.getByRole('banner')).getByRole('status')).toHaveTextContent(
   -      'The cart drawer is not available yet.',
   -    );
   +    expect(await screen.findByRole('dialog', { name: 'Your cart' })).toBeInTheDocument();
      });
   ```

   c. **Student 4, `tests/member-4/pages.test.tsx`** — featured products now load from the catalog
   mock by default:

   ```diff
   -  it('renders one h1 and labels the featured area as pending while the catalog is a stub', async () => {
   +  it('renders one h1 and featured products from the catalog mock by default', async () => {
        renderInLayout('/en', <HomePage />);
        expect(
   -      await screen.findByText(
   -        'Featured chocolates will appear here once the catalog is connected.',
   -      ),
   -    ).toBeInTheDocument();
   +      await screen.findByRole('link', { name: 'Assorted Praline Collection' }, { timeout: 3000 }),
   +    ).toHaveAttribute('href', '/en/products/assorted-praline-collection');
   ```

   The shell key `shell.cart.pending` and the Header's `NotImplementedError` branch become unused
   once this merges; Student 2 may remove them later.

2. **Student 1, `server/src/app.ts` — CORS exposed headers.** For a cross-origin deployment the
   client must read the pagination headers (docs/contracts.md "Cross-origin deployments expose those
   headers through CORS"):

   ```diff
   -app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
   +app.use(
   +  cors({
   +    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
   +    exposedHeaders: ['X-Page', 'X-Limit', 'X-Total-Count', 'X-Total-Pages'],
   +  }),
   +);
   ```

3. **Student 2, `package.json` — named seed script (optional).** `"seed:catalog": "tsx
server/src/features/catalog/seed.ts"`. Until then the README documents the `npx tsx` command.
4. **Student 2, `tests/e2e/photos.spec.ts`.** On `/en` the featured product photos now arrive from
   `api.catalog` after the spec's scroll loop, so they stay lazy above the viewport and the poll
   times out. Verified fix (3/3 pass on Chrome):

   ```diff
        const images = page.locator('main img');
        expect(await images.count()).toBeGreaterThan(5);
   +    // Content that arrives after the scroll (e.g. featured products from api.catalog) can sit
   +    // above the viewport; load every image eagerly so the check covers it too.
   +    await images.evaluateAll((nodes) =>
   +      nodes.forEach((node) => node instanceof HTMLImageElement && (node.loading = 'eager')),
   +    );
   ```

   Also suggested for the overflow list in `tests/e2e/shell.spec.ts`: replace
   `/en/products/fixture-bar-1` (now a 404 page) with `/en/products/peru-85-dark-bar`, and add
   `/es/checkout`.

5. **Student 2, `client/src/routes.tsx` — code splitting (Phase 4).** The client bundle is 513 kB,
   just over Vite's 500 kB advisory. Lazy-loading routed pages (`React.lazy` + `Suspense` in
   `PageFrame`) would remove the warning; this belongs to the Phase 4 optimization step.
6. **Contract note (Student 2, no change requested now).** `CatalogApi` has no lookup by id, so the
   cart resolves products for lines it has not seen by paging `list({ limit: 48 })`. If the catalog
   grows, a reviewed `ids` query key (or `getMany(ids)`) would avoid that.

## Known limitations and next step

- Cart routes 401 and checkout guest-only on the real server until Student 1's middleware lands;
  503 until `connectDb` runs. Mock mode (default) is fully usable for the Phase 2 demo.
- Persistence tests and Chromium e2e were not run on my machine (no Docker; Playwright download
  failed); please run them in CI or with `npm run services`.
- Order confirmation relies on route state: reloading the same tab entry keeps the real receipt
  (browser history state); a new tab or direct URL shows a safe link back to the catalog.
- Fictional products and CC0 stock photos only; real catalog content must come from the team.
- Next: wire Student 1's ports when merged; Phase 3 binds the UI to the HTTP adapter and runs the
  persistence suite against real Mongo.
