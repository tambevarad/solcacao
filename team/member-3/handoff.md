# Student 3 handoff

Current phases: 3 (Integration & API Bind) and 4 (Audit, Polish & Launch), together in one PR under
D22, ready for review on `reethika-catalog`. Evidence: `team/member-3/phase-3-evidence.md` and
`team/member-3/phase-4-evidence.md`. Phase 2 is integrated (PR #9); Phase 1 status is still
`not_started` (D21).

## Review of teammate changes to catalog files (2026-11-12)

Reviewed by Reethika (Student 3) against each merge commit's first parent; catalog tests run with
`TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test_ci`: `tests/member-3` and
`tests/member-5/retail-quantity.test.tsx`, 152/152 passed, none skipped.

- **PR #15, Daniel, product-card quantity picker (`abfe61f`):** **accepted.** It fits the cart design:
  it forwards through `cart.add(id, quantity)`, limits the amount to stock, 99 and the quantity already
  in the cart, reuses existing EN/ES keys and changes no contract. Follow-ups that Student 3 fixes
  in Phase 3, in Student 3's own files:
  1. `cart.add` resolves even when a signed-in save fails (the provider raises a notice), so the card
     resets to 1 and the page announces "added" for an unsaved change; the notice shows only in the
     drawer. Fix: the cart reports whether the save succeeded, the card keeps the amount on failure,
     and the catalog page shows the save problem. Add a test against the real `CartProvider`; the
     matching change to `tests/member-5/retail-quantity.test.tsx` goes to Daniel as a proposal.
  2. A quantity above the limit disables Add to cart before any message appears (only on blur or
     Enter). Fix: show the range message as soon as the value is out of range.
- **PR #17, Varad, quantity clamp race (`a27cd79`):** **accepted as is.** Clamping during render when
  the remaining quantity changes, instead of in a mount effect, is correct and keeps typed values.

**Outcome in Phase 3 (this PR).** Both follow-ups are fixed in Student 3's files. `CartDetails` (catalog
internal) gained `addLine()`, which reports `added | limited | unchanged | failed`; `CatalogPage`
rejects `onAdd` on `failed`, so the card keeps the amount and shows its alert, and `ProductPage`
shows an alert with "View cart". A failed signed-in save now rolls back to the lines the server
last confirmed: without that, keeping the amount let a retry add it twice (a test caught quantity 6
instead of 3). The card explains an out-of-range amount as soon as it is typed. Tests against the
real `CartProvider` are in `tests/member-3/pages.test.tsx`. **No change is needed in
`tests/member-5/retail-quantity.test.tsx`:** it reads `catalog.cart.saveFailed` by key (the text
changed to add "Please make it again.") and still passes, as a unit test of the card.

## Public exports delivered

- **Client cart port** (`client/src/features/catalog/public.tsx`, signatures unchanged):
  `useCart(): CartState`, `CartProvider` (mounted once in `main.tsx`), `CartDrawer`. While the drawer
  is closed, `CartDrawer` also floats merge results, conflict reloads and load failures over the page
  (an `aside` labelled "Cart update" / "Aviso del carrito").
- **`api.catalog`** (`list`, `get`, `cart`, `persist`, `merge`, `checkout`) in HTTP mode against the
  real API; the homepage and the sampler use it (verified live, journey 11). Fixtures are not
  imported by the UI any more (the canonical origins live in `rules.ts`).
- **Server:** `catalogRouter`, `createCatalogRouter`, models, `getActiveProductsByIds` (unchanged).
  New product indexes (`models.ts`); `npm run seed:catalog` upserts fixtures and syncs product indexes.
- **Pages:** paths and default exports unchanged.

## Peers

- **Student 1 (Aman):** nothing to report. Every sign-in, sign-out, account switch and reload journey
  passed against the real auth API; no file of Student 1 was edited.
- **Student 2 (Varad):** proposals 8–10 below.
- **Student 4 (Krish):** proposal 7 below (display only).
- **Student 5 (Daniel):** nothing to change (see the outcome above).

## Shared change proposals

Phase 2 proposals 1–6 have landed or were superseded (stale stub tests, CORS exposed headers,
`seed:catalog`, the eager-photo e2e fix, route code splitting, the lookup-by-id contract note).

7. **Student 4, `client/src/features/b2b/components/FeaturedProducts.tsx` — translate the origin.**
   On `/es` the featured cards show the canonical English origin ("Dominican Republic · 60% cacao")
   while the catalog shows "República Dominicana". The catalog's labels are the keys
   `catalog.origin.<CanonicalNameWithoutSpaces>` (for example `catalog.origin.DominicanRepublic`; seen on the deployed `/es` homepage as "Dominican Republic" and "Peru"),
   which the shell already merges into every dictionary. Exact change (no contract impact):

   ```diff
   -              {t('b2b.featured.details', { origin: product.origin, cacao: product.cacaoPct })}
   +              {t('b2b.featured.details', {
   +                origin: t(`catalog.origin.${product.origin.replace(/\s+/g, '')}`),
   +                cacao: product.cacaoPct,
   +              })}
   ```

   If reading another feature's keys is not wanted, the alternative is for Student 3 to export a
   `useOriginLabel()` hook from `catalog/public.tsx`; that adds to the public surface, so it needs
   Student 2's review first.

8. **Student 2, `.github/workflows/ci.yml` — run the catalog live journeys in `e2e-live`.** Add after
   `npm run test:e2e:live` (same job, same API and database; three registrations, well within the
   limit of 10 per hour):

   ```yaml
   - name: Catalog live journeys (Student 3)
     run: npx playwright test --config tests/member-3/playwright.config.ts
     env:
       LIVE_MONGODB_URI: mongodb://127.0.0.1:27017/solcacao_e2e
   ```

   No change is needed in `tests/e2e/live/journeys.live.spec.ts`: its catalog, guest-order and merge
   journeys pass on this branch. Optional, for the closing turn: after the merge assertion
   (`Open cart. Items: 1`) add
   `await expect(page.getByRole('complementary', { name: 'Cart update' })).toContainText('We added the items');`
   to check that shoppers see the merge result outside the drawer.

9. **Student 2, Railway, after this PR deploys.** (a) Run the seed once against the demo database
   (docs/deployment.md step 6). It now also calls `syncIndexes()` for products, which drops the two
   Phase 2 list indexes (`active_1_category_1_priceCents_1`, `active_1_origin_1`); the new ones are
   built at startup. (b) Rerun
   `LIVE_BASE_URL=https://solcacao-production.up.railway.app PW_CHANNEL=chrome npx playwright test --config tests/member-3/playwright.config.ts`
   **without** `LIVE_EXPECT_FLOATING_NOTICE=0` and record the result in `phase-4-evidence.md`. Before
   this PR the deployed site returned products with `X-Total-Count: 0` for `?origin=peru`.

10. **Students 2, 4 and 1, timing seen while running the full suite (no patch, for information).**
    `tests/tooling.test.ts › accepts Phase 1 briefs for every role…` timed out once at 5 s on a full
    `npm run check` (passed on the rerun), and `tests/e2e/live/journeys.live.spec.ts › the catalog
comes from the live API…` failed once in three local runs (passed twice). If either recurs in
    CI, a per-test timeout or a wait for the routed request before asserting the error state would
    help. The 1 s Testing Library default also timed out once each, on full runs only, in
    `tests/member-4/images.test.tsx › loads only the first hero photo…` (Student 4) and
    `tests/member-1/pages.test.tsx › registration › creates a retail account…` (Student 1); both
    pass alone. On untouched `development` the full suite failed 2 of 5 runs here (5 timing
    failures, including Student 4's featured-products tests); this branch passed its last 3 runs.
    `configure({ asyncUtilTimeout: 3000 })`, as `tests/member-3/pages.test.tsx` now does, is one
    remedy that keeps the assertions unchanged.

## Known limitations and next step

- Not yet in CI: `tests/member-3/retail-journey.live.spec.ts` (proposal 8). Locally it needs the
  compiled API, a seeded database and, where the Playwright Chromium download fails, `PW_CHANNEL=chrome`.
- The deployed site gets this PR's fixes only after the merge; the post-merge checks are proposal 9.
- Mailpit is unavailable on this machine (no Docker), so Student 2's live contact journey cannot pass
  here; catalog journeys send no email.
- Simulated checkout checks stock only at submission (documented in the catalog README).
- Fictional products and CC0 stock photos only; real catalog content must come from the team.
