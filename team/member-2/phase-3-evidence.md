# Student 2 Phase 3 evidence

State: turn 1 integrated (PR #27 merged as 62e52e4, follow-up #28 as 13a60a2); closing turn ready for review in PR #33 (D22: Phases 3 and 4 share each PR). The live-API browser journeys pass in CI, and the app is deployed on Railway (phase-4-evidence.md).

## Implemented requirements and changed paths

- **Decision D22** (`docs/decisions.md`): Phases 3 and 4 together, one member at a time (Students 2, 4, 3, 5, 1, then a closing Student 2 turn). `scripts/phase-brief.mjs` shows an unfinished Phase 3 as a D22 note in Phase 4 packets, not a blocker, and adds the turn order and reference docs to Phase 3 and 4 packets. Covered by `tests/tooling.test.ts`.
- **Step 1, HTTP mode through configuration only.** The `Dockerfile` builds with `VITE_API_MODE=http`, and the CI job `e2e-live` sets it in its environment. No feature code changed. `vitest.config.ts` pins `VITE_API_MODE=mock` for unit tests: an HTTP-mode `.env` had switched 67 unit tests to the HTTP adapters.
- **Step 3, live-API browser journeys.** `playwright.live.config.ts` and `tests/e2e/live/journeys.live.spec.ts` (`npm run test:e2e:live`) contain:
  - the catalog loads from `GET /api/products`, and an aborted request shows the error state;
  - a guest order gets `201` from `POST /api/orders` with the server-side total (999 cents) and the confirmation page;
  - a newly registered account merges a guest cart through `POST /api/cart/merge`, and after a reload (which signs out) signing in again shows the saved cart.
  - Placeholders (`test.fixme`) for the quote and sampler journeys, filled in the closing turn from Students 4 and 5.

  CI job `e2e-live` runs them against `mongo:7.0`, with the seeded catalog and the compiled API serving the built client. Mailpit runs in that job, but none of these three journeys sends mail. The follow-up PR to Krish's review adds a contact-enquiry journey that checks the email arrives in Mailpit's inbox. The Phase 2 mock checks run as their own job, `e2e-mock`; `playwright.config.ts` ignores `tests/e2e/live`.

- **Step 5, production serving.** `server/src/features/shell/client.ts` (`createClientRouter`):
  - `/api` passes through and keeps its JSON 404;
  - hashed `/assets` files are cached for a year;
  - `/en` and `/es` deep links get `index.html` with `no-cache`; other paths get it with a 404;
  - startup is refused without a build or when the root overlaps `UPLOAD_DIR`.

  It is mounted in `server/src/app.ts` only when `CLIENT_DIST_DIR` is set (Student 1's file: coordinator-approved ownership exception, recorded in handoff proposal 1). Tests: `tests/member-2/client-serving.test.ts`. Also `.env.example` (`CLIENT_DIST_DIR`), `server/src/features/shell/README.md`, and `docs/deployment.md` (status plus the Railway runbook).

## Commands actually run

macOS, Node 24.19.0, 2026-11-12. Docker Desktop was not running, so no local MongoDB.

| Command                                                                                                                              | Result                         | Relevant output or test count                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                                                                                                                      | pass                           | Typecheck; 40 test files passed, 4 skipped; 499 tests passed, 46 skipped (persistence suites, no `TEST_MONGODB_URI`); structure, translation parity and workflow valid                          |
| `npx vitest run tests/member-1 tests/member-2 tests/member-4 tests/tooling.test.ts` with `.env` `VITE_API_MODE=http`, before the pin | fail                           | 67 failed: unit tests used the HTTP adapters. Fixed by the `vitest.config.ts` pin                                                                                                               |
| same, after the pin                                                                                                                  | pass                           | 318 passed, 24 skipped                                                                                                                                                                          |
| `npx vitest run tests/member-2/client-serving.test.ts tests/member-2/assets.test.ts`                                                 | pass                           | 21 passed                                                                                                                                                                                       |
| `npm run check:workflow`                                                                                                             | pass                           | CI baseline valid with the new jobs                                                                                                                                                             |
| `npm run check:ownership -- --member 2 --base development`                                                                           | flags `server/src/app.ts` only | the recorded ownership exception                                                                                                                                                                |
| `npx playwright test --config playwright.live.config.ts --list`                                                                      | pass                           | 5 tests: 3 journeys, 2 placeholders                                                                                                                                                             |
| `npm run test:e2e:live`                                                                                                              | **not run locally**            | needs MongoDB; run in CI instead (below)                                                                                                                                                        |
| `docker build .`                                                                                                                     | **not run locally**            | Docker daemon not running; built in CI instead (below)                                                                                                                                          |
| CI on PR #27, run 43330996734 (`3edf69e`)                                                                                            | pass except `e2e-mock`         | `e2e-live` 3 passed against mongo:7.0 (Mailpit running; these journeys send no mail); `image` built; `verify` passed; `e2e-mock` failed on a photo check (`photos.spec.ts`), fixed in `934ea77` |
| CI on PR #27, run 43331635312 (`934ea77`)                                                                                            | pass                           | `e2e-live`, `e2e-mock` (15 passed), `image` and `verify` (after one rerun of a known timing flake in `tests/member-3/pages.test.tsx`)                                                           |

## Manual demo observations

On 2026-11-12 the compiled app was served without a database (local script `.agent/serve-client-only.ts`, built with `VITE_API_MODE=http`) and checked in the browser at 1280 px:

- `/es/catalog` loads on a fresh request, in Spanish, with its page chunk loaded on demand and the dictionary from `/api/i18n/es`;
- with the API answering 503, the catalog shows "No se pudieron cargar los chocolates" with a retry button and no mock data;
- `/fr/catalog` returns 404 with the app's not-found page; `/api/nope` and `/assets/nope.js` return JSON 404s;
- `/api/health` reports the database disconnected;
- no Content-Security-Policy errors.

Phone width and keyboard were not rechecked: no visible UI changed apart from the page loading state.

## Public contract compatibility and peer dependencies

No DTO, route or `docs/api.json` change. `server/src/app.ts` gains one conditional mount (Student 1, exception above). The live journeys use Students 1 and 3's endpoints as published.

## Closing turn (PR #33, 2026-11-14)

All five member turns had merged (development at `3e0c1f1`, PR #32).

### Changed paths

- `tests/e2e/live/journeys.live.spec.ts`: the quote journey (Student 4's proposal 1) and the sampler journey (Student 5's proposal, plus a Mailpit inbox check by a unique message marker) replace the two `test.fixme` placeholders. The merge journey also checks the "Cart update" notice (Student 3's proposal 8). Mail checks accept `MAILPIT_AUTH` for the deployed inbox.
- `.github/workflows/ci.yml`: `e2e-live` also runs `tests/member-3/playwright.config.ts` (Student 3's proposal 8).
- `server/src/features/shell/client.ts` exports `APP_ROUTES`; `tests/member-2/client-serving.test.ts` checks it equals the routes in `client/src/routes.tsx` (with `:param` as `[^/]+`) in both directions (Krish's note on #28).
- `client/src/styles.css`: the default focus ring moves into Tailwind's `base` layer. Unlayered, it beat every utility, so `focus-visible:outline-none` on `<main>` (focused after a page change) and on the quote headings never applied, and a copper frame surrounded the whole page after keyboard navigation.
- `package.json`, `package-lock.json`: the npm audit triage (phase-4-evidence.md).

### Commands actually run

macOS, Node 24.19.0, 2026-11-14. Docker Desktop was not running, so no local MongoDB or Mailpit.

| Command                                                                                                             | Result        | Relevant output or test count                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                                                                                                 | pass          |                                                                                                                                                 |
| `npx vitest run`                                                                                                    | pass          | 540 passed, 55 skipped (persistence suites, no `TEST_MONGODB_URI`)                                                                              |
| `npx vitest run tests/member-2` (after the layout change)                                                           | pass          | 143 passed, 4 skipped                                                                                                                           |
| `npm run check:structure`, `npm run check:workflow`, `npx prettier --check` on changed files                        | pass          |                                                                                                                                                 |
| `VITE_API_MODE=http npm run build`                                                                                  | pass          | no chunk-size warning                                                                                                                           |
| `npx playwright test --config playwright.live.config.ts --list`                                                     | pass          | 6 journeys, no placeholders                                                                                                                     |
| `npm run check:ownership -- --member 2 --base origin/development`                                                   | flags 2 files | Student 1's two READMEs: the recorded docs-only exception (handoff.md)                                                                          |
| CI on PR #33, run 43665224227 (`0fc6b00`)                                                                           | pass          | `verify` 595/595 against MongoDB, none skipped; `e2e-live` 6/6 (`tests/e2e/live`) and 11/11 (`tests/member-3`); `e2e-mock` 15/15; `image` built |
| `LIVE_BASE_URL=https://solcacao-production.up.railway.app`, the catalog and guest-order journeys (installed Chrome) | pass          | 2 passed against the deployed site                                                                                                              |

### Manual demo observations

- Mock build in the browser at 375 px and desktop: after pressing Enter on a nav link, `<main>` has focus with `outline-style: none`; a focused link keeps the 3px copper outline with a 3px offset.
- The live journeys that sign in or read the inbox (merge, contact, quote, sampler) were not run by the agent against the deployed site: they register accounts and need the inbox password. They pass in CI against MongoDB and Mailpit; Varad runs them on the deployed site (docs/deployment.md).

## Known limitations or blocked checks

- Persistence suites and the live journeys were not run locally (no Docker); CI ran them on MongoDB and Mailpit.
- The two README lines in Student 1's files are a coordinator ownership exception (docs only), recorded in handoff.md and the PR.

## Review

Proposed commit: `varad-shell` (PR #33; turn 1 was PR #27 and #28)
Reviewer: Krishr21 (D22)
PR: https://github.com/tambevarad/solcacao/pull/33
Integrated commit: turn 1 `62e52e4` and `13a60a2`; closing turn pending
