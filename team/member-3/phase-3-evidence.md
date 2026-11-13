# Student 3 Phase 3 evidence

State: ready for review (D22: Phases 3 and 4 in one PR, turn 3 of the sequence). Branch
`reethika-catalog`, started from `development` at `2e06236` (PR #29 merged); `git merge
origin/development` was already up to date. All checks below ran on Windows 11 with Node 24.19.0, a
local MongoDB 9.0.4, and `TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test_ci` set in
PowerShell. The live journeys used the compiled API (`node dist/server/server/src/index.js`) serving
the HTTP-mode build (`VITE_API_MODE=http`, `VITE_API_BASE_URL=/api`) against
`mongodb://127.0.0.1:27017/solcacao_e2e` after `npm run seed:catalog`. No mock counted as evidence.

## Implemented requirements and changed paths

1. **HTTP binding, no fixture leakage, no fallback.** The canonical origin list moved from
   `fixtures.ts` to `rules.ts`, so the UI no longer imports the fixture catalog; the HTTP-mode bundle
   contains no fixture text (`grep "Fictional single-origin|Tableta oscura Ecuador" dist/client/assets/*.js`:
   none). `api/index.ts` (Student 2) selects adapters at build time; there is no fallback path, and a
   failed request shows the error state (live journey 1).
2. **Sign-in flows with Student 1's real auth.** Guest merge (capped by stock), lost merge response
   retried with the same mergeId, logout, account switch, reload, and a conflicting write from another
   window all pass against the real `/api/auth` and `/api/cart` (live journeys 3–6). No failure was
   found in Student 1's sign-in, so nothing was reported to Aman.
3. **Homepage and sampler use the same products.** Live journey 11 compares `/api/products` with
   Student 4's featured cards (name, link, price, image URL and alt) and Student 5's sampler (every
   active product, image URL). Both use `api.catalog`; no duplicate fixtures. One display difference
   for Student 4 (origin not translated on `/es`) is proposal 7 in `handoff.md`.
4. **Browser scenarios** (`tests/member-3/retail-journey.live.spec.ts`, 11 journeys): filters → sort →
   product page; guest cart quantities at live prices across a reload; sign-in merge; lost-response
   retry; logout and account switch; revision conflict; signed-in checkout read back from the `orders`
   collection; stale stock refused at checkout after switching to Spanish; EN/ES switch keeping filters
   and cart; phone width (375 px) filter and cart drawers with keyboard focus and no overflow; homepage
   and sampler parity. Each test asserts no console errors.
5. **Indexes, measured before changing** (table below). Fixed alongside: the count ran without the
   collation and the page with it, so `origin=peru` returned Peru products with `X-Total-Count: 0`
   (reproduced on the deployed site, see Phase 4). Origin is now exact in both; collation is used only
   for name sorts; priceDesc ties are `_id` descending. The production seed stays opt-in (refuses
   `NODE_ENV=production`) and there is no reset endpoint.
6. **Notes** in `server/src/features/catalog/README.md`: cart algorithm, simulated-order limits, API
   examples, demo reset, trigger audit (none specified, none added; atomic writes instead), security
   sweep and ES/EN audit.

Also, from the review of PR #15/#17 (decision recorded in `handoff.md`):

- **A failed save is no longer reported as added.** `CartProvider` gains a catalog-internal
  `addLine()` returning `added | limited | unchanged | failed`; the public `useCart().add()` signature
  and behavior are unchanged. A lost or failed signed-in save rolls back to the last confirmed lines,
  so the card can keep the chosen amount without counting it twice on retry (found by my own test:
  without the rollback, a retry sent quantity 6 instead of 3). The product page shows an alert with
  "View cart" instead of "added".
- **Out-of-range card amounts are explained at once**, not only on blur.
- **Cart news outside the drawer.** Merge results, conflict reloads and load failures previously
  rendered only inside the closed drawer, so after sign-in the shopper never saw "3 instead of 5".
  `CartDrawer` now floats that notice over the page while the drawer is closed (new key
  `catalog.cart.noticeLabel`). Found by live journey 3.
- **Drawer quantity race.** `QuantityStepper` synced its draft in an effect that could overwrite a
  freshly typed value; it now syncs during render, as PR #17 did for the product card. Found by the
  stress run below.

Changed paths (all Student 3): `client/src/features/catalog/{cart/CartProvider.tsx,
components/CartDrawer.tsx, components/CartNoticeView.tsx, components/FilterForm.tsx,
components/ProductCard.tsx, components/format.ts, fixtures.ts, locales/en.json, locales/es.json,
pages/CatalogPage.tsx, pages/ProductPage.tsx, rules.ts}`, `server/src/features/catalog/{models.ts,
service.ts, seed.ts, README.md}`, `tests/member-3/{adapters.test.ts, pages.test.tsx,
persistence.test.ts, index-bench.mts, playwright.config.ts, retail-journey.live.spec.ts}`,
`team/member-3/*`.

## Index measurements (5,000 synthetic products, 4,500 active; keys/docs examined, best of 5)

`npx tsx tests/member-3/index-bench.mts none|current` (`NO_COLLATION=1` for the shipped query shape).

| Query                               | No index       | Phase 2 indexes                    | Phase 3 indexes and query              |
| ----------------------------------- | -------------- | ---------------------------------- | -------------------------------------- |
| default (name, en)                  | COLLSCAN 5,000 | 4,500 keys + in-memory SORT, 61 ms | `active_name_en` 12 keys, 0–1 ms       |
| priceAsc, no filter                 | COLLSCAN 5,000 | 4,500 + SORT, 44 ms                | `active_price` 12, 1 ms                |
| category=bar, priceAsc              | COLLSCAN 5,000 | 4,500 + SORT, 42 ms                | `active_category_price` 12, 0–1 ms     |
| origin=Peru, name es                | COLLSCAN 5,000 | 4,500 + SORT, 46 ms                | `active_name_es` 80, 2–3 ms            |
| origin=Peru, cacao 60–80, priceDesc | COLLSCAN 5,000 | 4,500 + SORT, 40 ms                | `active_price` 283, 8–13 ms            |
| price 1000–2000, priceAsc, page 5   | COLLSCAN 5,000 | 1,137 + SORT, 9 ms                 | `active_price` 60 keys / 12 docs, 1 ms |
| category=truffle, name en, page 3   | COLLSCAN 5,000 | 4,500 + SORT, 48 ms                | `active_name_en` 107, 2–5 ms           |

The Phase 2 indexes were slower than a collection scan (12–22 ms) because the collation stopped them
from bounding `category`/`origin`. A test now asserts that the winning plans use an index with no
`SORT` stage.

## Commands actually run

| Command                                                                                  | Result  | Relevant output or test count                                                                                                                |
| ---------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                                                                      | pass    | client and server                                                                                                                            |
| `npx vitest run tests/member-3 tests/member-5/retail-quantity.test.tsx`                  | pass    | 160 passed, 0 skipped (persistence ran against MongoDB)                                                                                      |
| `npm run check`                                                                          | pass    | 46 files, 572 passed, 0 skipped; structure and workflow valid. First run: 2 timeouts at 5 s, see below                                       |
| `npm run build` (`VITE_API_MODE=http`)                                                   | pass    | no chunk-size warning                                                                                                                        |
| `npm run check:ownership -- --member 3 --base development`                               | pass    | all changed files within Student 3 ownership                                                                                                 |
| `npx playwright test --config tests/member-3/playwright.config.ts` (`PW_CHANNEL=chrome`) | pass    | 11 passed against the local live API and MongoDB                                                                                             |
| `npm run test:e2e` (mock mode)                                                           | pass    | 15 passed, via a temporary uncommitted config adding `channel: 'chrome'` (Playwright Chromium download fails on this machine, as in Phase 2) |
| `tests/e2e/live` (Student 2's shared live suite, same Chrome workaround, local API)      | partial | 3 passed (catalog, guest order, merge); 1 failed: contact journey needs Mailpit (no Docker here; enquiry saved 201); 2 `fixme` (later turns) |
| `pages.test.tsx` 20× under 5 parallel copies                                             | pass    | 20/20 after the fixes (before: the drawer race failed 1/20, the cold-start wait 2/12)                                                        |
| `npx tsx tests/member-3/index-bench.mts`                                                 | done    | table above                                                                                                                                  |

Timeouts on the first `npm run check`: my `keeps only the latest 100 merge markers` test (101
sequential HTTP merges, 6.9 s here) now has its own 30 s budget; Student 2's
`tests/tooling.test.ts › accepts Phase 1 briefs…` timed out once at 5 s and passed on the rerun
(reported in `handoff.md`, not my file). Student 2's live catalog journey also failed once in three
runs and passed twice; reported likewise.

Full-suite stability after the last code change (`npx vitest run`, same machine): this branch, 5
runs, 3 clean in a row at the end, 2 with a one-off 1 s timeout in a teammate's test (Student 4
`images.test.tsx`, Student 1 registration; both pass alone). Untouched `origin/development` in a
temporary worktree: 2 of 5 runs failed with 5 timing failures, including three of the catalog
flakes this PR fixes (drawer race, out-of-stock wait, merge-marker timeout).

**Flake fixed (`pages.test.tsx`, PR #27).** Root cause: the checkout's demo banner renders before the
cart's products are resolved, and until then the submit button is disabled, so a click on a slow
runner did nothing and the 1 s wait expired ("reuses the requestId…" waiting for "The order could not
be placed", and "validates fields…" waiting for the alert). Both tests now wait for the review line
and the enabled button, then assert exactly as before (plus that `checkout` ran once, then twice);
the Spanish out-of-stock test got the same guard, and the file's async waits allow 3 s.

## Manual demo observations

Desktop/mobile widths; EN/ES; keyboard; happy path; error path. All automated (Chrome); a human
visual review is still required:

- Scripted audit (Chrome) of `/en|es` × 375/768/1440 px × catalog, filtered catalog, product, checkout
  on the local build: 24/24 with no horizontal overflow, correct `lang`, no console errors.
- Keyboard: cart drawer opens with Enter from the header, traps focus, closes on Escape and returns
  focus (live journey 10); checkout error summary takes focus (unit test).
- EN/ES: switching on catalog and checkout keeps filters, sort, cart and typed address; prices stay
  USD (`9,99 US$`).
- Error paths: aborted product request → error state with filters kept; lost merge → guest cart kept,
  Try again adds once; another window's write → 409, reload and "make your change again"; stock
  bought out after the page loaded → 409 `OUT_OF_STOCK`, line explained, nothing ordered.
- Demo (5 minutes) is drafted in `phase-4-evidence.md`.

## Public contract compatibility and peer dependencies

No DTO, route, `CatalogApi` or `CartState` change; `contractVersion` unchanged. `CartDetails`
(catalog-internal) gained `addLine`. Product list order changes only for priceDesc ties (`_id`
descending; the contract says only "id as tie breaker"). Peers used: Student 1's auth (real),
Student 2's shell, build and route splitting, Student 4's homepage and Student 5's sampler (read
only). Proposals for Students 2, 4 and 5 are in `handoff.md`.

## Known limitations or blocked checks

- Mailpit/SMTP not available here (no Docker): Student 2's live contact journey cannot pass locally;
  catalog journeys send no email.
- Playwright Chromium could not be downloaded; every browser run used the installed Google Chrome
  (`channel: 'chrome'`). CI uses Chromium.
- `tests/member-3/retail-journey.live.spec.ts` is not yet run by CI; proposal 8 in `handoff.md`.
- Checkout still checks stock only at submission (documented limitation of the simulated order).

## Review

Proposed commit: see the PR (focused commits on `reethika-catalog`).
Reviewer: requested from tambevarad (Student 2).
PR: https://github.com/tambevarad/solcacao/pull/30
Integrated commit: (recorded by the reviewer after merge)
