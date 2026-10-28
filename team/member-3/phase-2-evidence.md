# Student 3 Phase 2 evidence

State: **ready_for_review** on `reethika-catalog` (based on `development` @ `70bac90`). Not integrated;
a reviewer records integration after the PR merges.

Phase 1 note (decision D21): my Phase 1 status is still recorded as `not_started` in
`status.json`. D21 authorizes Phase 2 anyway; nothing here claims Phase 1 was done or integrated.

## Implemented requirements and changed paths

Requirements: CAT-01…CAT-05, CART-01…CART-04, ORDER-01 (Phase 2 columns of docs/requirements.md).

| Area                      | Paths                                                                                   | What it does                                                                                                                                                                                                                                                                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared rules              | `client/src/features/catalog/rules.ts`                                                  | Strict `ProductQuery` schema and URL-primitive parser, filter/sort predicates, cart-line/merge/checkout schemas, `mergeLines`, canonical checkout hash input, ISO country check. Imported by the mock **and** the Express router so semantics cannot drift.                                                                                  |
| Fixtures (F1)             | `client/src/features/catalog/fixtures.ts`                                               | 15 fictional EN/ES products, fixed `5c0ca0…` ids, 3 categories, 6 origins, cacao 35–100 %, $6.50–$38.00, one sold out, one low stock (3), one inactive; 1–2 `productPhotos` each. `makeFixtureProducts()` in contracts/fixtures.ts is untouched.                                                                                             |
| Mock adapter (F2, F6, F7) | `client/src/features/catalog/mock.ts`                                                   | Same interface and errors as HTTP; saved carts keyed by the `mock:<userId>` token from `api/session.ts`; revision conflicts, idempotent merges (latest 100 mergeIds), simulated checkout with requestId idempotency; no module-level calls.                                                                                                  |
| HTTP adapter (B7)         | `client/src/features/catalog/http.ts`                                                   | `requestRaw<Product[]>` + `X-*` headers → `ProductPage`; persist sends the raw array with `If-Match: "<rev>"`; no `"undefined"` query values.                                                                                                                                                                                                |
| Cart state (F5, F6)       | `client/src/features/catalog/cart/*`, `public.tsx`                                      | `CartProvider`/`useCart`/`CartState`/`CartDrawer` unchanged in shape. Guest cart in `solcacao.guestCart.v1` (`{items, mergeId}`, rotated per edit, corrupt data reset). Merge-on-login against `useAuth` transitions, serialized saves, conflict refetch, stale-response guard, logout → empty guest cart.                                   |
| Pages (F3, F4, F7)        | `client/src/features/catalog/pages/*`, `components/*`, `filters.ts`                     | URL-driven catalog (filters, sort, page; mobile filter drawer; distinct loading/empty/error), product page (1:1 gallery, accordions, stock-aware add), shared right `Drawer` cart, checkout (validation + focusable error summary, requestId per distinct body, double-submit guard, no-payment notice), confirmation from route state only. |
| Dictionaries (F8)         | `client/src/features/catalog/locales/{en,es}.json`                                      | 158 matching `catalog.*` keys.                                                                                                                                                                                                                                                                                                               |
| Backend (B1–B6)           | `server/src/features/catalog/{models,service,router,errors,types,seed}.ts`, `README.md` | Product/Inventory/Cart/Order schemas and indexes, DTO serializers, list/slug routes, `getActiveProductsByIds`, atomic persist/merge, simulated orders, explicit idempotent seed, injected auth with fail-closed defaults, 503 without DB.                                                                                                    |
| Tests (B8)                | `tests/member-3/*`                                                                      | 141 tests (120 run, 21 Mongo tests skipped here — see below).                                                                                                                                                                                                                                                                                |

## Commands actually run

Environment: Windows 11, Node 24.19.0 / npm 11.17.0 (nvm-windows), no Docker.

| Command                                                                                                | Result              | Relevant output or test count                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run setup -- --member 3`                                                                          | pass                | branch `reethika-catalog`, `npm ci` ok                                                                                                                                       |
| `npm run typecheck`                                                                                    | pass                | client + server, no errors                                                                                                                                                   |
| `npx vitest run tests/member-3`                                                                        | pass                | 5 files passed, 1 skipped; **120 passed, 21 skipped** (`persistence.test.ts`, no `TEST_MONGODB_URI`)                                                                         |
| `npm run check`                                                                                        | **fail**            | 321 passed, 5 failed, 31 skipped. Failures: 4 teammate tests that assert stub behavior (patches in handoff.md, verified passing) + 1 pre-existing timing failure (see below) |
| `npm run check:structure` / `check:workflow` (run separately, since `check` stops at the test failure) | pass                | translation parity valid; roster/CI valid                                                                                                                                    |
| `npm run build`                                                                                        | pass, 1 warning     | main chunk 513 kB > Vite's 500 kB advisory (proposal 5 in handoff.md)                                                                                                        |
| `npm run check:ownership -- --member 3 --base development`                                             | pass                | all 36 changed files within Student 3 ownership                                                                                                                              |
| `npx playwright install chromium`                                                                      | **fail**            | download from cdn.playwright.dev failed 5×/attempt (3 attempts), though `curl` reaches the same archive — environment network issue                                          |
| `npm run test:e2e`                                                                                     | **not run**         | Playwright Chromium executable missing (install failed)                                                                                                                      |
| Same e2e specs via a temporary, uncommitted config using installed Google Chrome (`channel: 'chrome'`) | 10 passed, 1 failed | `photos.spec.ts › all photos load on /en`: featured product photos arrive after the spec's scroll and stay lazy; patch verified 3/3 (proposal 4)                             |
| MongoDB persistence tests                                                                              | **not run**         | Docker is not installed, so `npm run services` could not start Mongo                                                                                                         |

Baseline before any change (`development` @ `70bac90`): `npm run check` already had 2 failing tests in
`tests/member-4/pages.test.tsx` on this machine (1 when the file runs alone). The remaining
`shows featured products … localized price and links` failure is a `findBy` 1 s timeout on this
slower machine, not caused by catalog code (it injects its own `listProducts`); it passed in the
run with the proposed patches applied.

## Manual demo observations

Mock mode, `npm run dev:client`, in-app Chromium browser:

- **Widths:** no horizontal overflow at 375, 768 and 1440 px on `/en/catalog`,
  `/es/catalog?category=truffle`, `/es/catalog?sort=priceDesc&page=2`,
  `/es/products/dominican-100-pure-bar` (longest Spanish name), `/en/products/foil-heart-duo`
  (inactive → "Product not found"), `/es/checkout`, `/en/order-confirmation`.
- **Filters:** `?search=dark&origin=Peru&cacaoMin=65&cacaoMax=90&priceMinCents=900&priceMaxCents=2300`
  → 2 results (Peru 85 % bar, walnut truffles); form shows the applied values. Back/forward and
  page reset are covered by `pages.test.tsx` (URL changes asserted).
- **Keyboard only:** quantity + Enter adds to cart; "View cart" opens the drawer with focus inside,
  Tab stays trapped (12 presses), body scroll locked, Escape closes and focus returns to the opener.
- **Guest cart:** survived a full page load and EN→ES switch (3 items, 72,00 US$).
- **Checkout (ES):** empty submit → focused error summary with 6 linked fields; valid synthetic
  data + two synchronous clicks → one confirmation, cart cleared, "Pedido de demostración — no se
  cobra ningún pago". An inactive line in the cart shows as unavailable and disables submit.
- **Confirmation reload:** reloading the same history entry keeps the browser's route state, so the
  real receipt stays; opening the URL without state shows "No order to show" + catalog link.
- **Console:** no errors or warnings during the session.
- Screens of empty vs error states and back/forward were verified by tests rather than by hand.

## Public contract compatibility and peer dependencies

- No change to `contracts/`, `docs/api.json`, routes, `main.tsx` or `app.ts`. `CartState`,
  `useCart`, `CartProvider`, `CartDrawer`, `CatalogApi` unchanged; `CartProvider` gained optional
  test-seam props only. Homepage call `api.catalog.list({ limit: 4, sort: 'name', locale })`,
  `?search=` and `?category=` links work unchanged.
- `getActiveProductsByIds(ids: string[]): Promise<Product[]>` exported from
  `server/src/features/catalog/service.ts` for Student 5.
- Student 1 (not merged): client merge-on-login is implemented against `AuthState` and tested with a
  `useAuth` double; server routes take injected `requireAuth`/`optionalAuth` and fail closed (cart
  401, checkout guest-only) until they land; 503 until `connectDb` runs.

## Known limitations or blocked checks

- MongoDB tests and `npm run test:e2e` (Chromium) not run here; reasons above.
- `npm run check` fails until the coordinator lands the four test patches in handoff.md.
- Real product photography/copy not supplied: fixtures are fictional, photos are CC0 stock.
- `CatalogApi` has no lookup by id, so the cart resolves products for unseen lines by paging
  `list({ limit: 48 })`; fine for this catalog size (proposal 6).

## Review

Proposed commits: `feat(catalog): …`, `test(catalog): …`, `docs(member-3): …` on `reethika-catalog`.
Reviewer: requested `tambevarad` (pending).
PR: see the PR into `development`.
Integrated commit: none (not merged).
