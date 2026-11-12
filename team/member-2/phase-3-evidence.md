# Student 2 Phase 3 evidence

State: in progress on `varad-shell` (first D22 turn; Phases 3 and 4 share one PR). Not ready for review yet: the live-API browser journeys have not run (their first run is this PR's CI), and the deployment is pending.

## Implemented requirements and changed paths

- **Decision D22** (`docs/decisions.md`): Phases 3 and 4 together, one member at a time (Students 2, 4, 3, 5, 1, then a closing Student 2 turn). `scripts/phase-brief.mjs` shows an unfinished Phase 3 as a D22 note in Phase 4 packets, not a blocker, and adds the turn order and reference docs to Phase 3 and 4 packets. Covered by `tests/tooling.test.ts`.
- **Step 1, HTTP mode through configuration only.** The `Dockerfile` builds with `VITE_API_MODE=http`, and the CI job `e2e-live` sets it in its environment. No feature code changed. `vitest.config.ts` pins `VITE_API_MODE=mock` for unit tests: an HTTP-mode `.env` had switched 67 unit tests to the HTTP adapters.
- **Step 3, live-API browser journeys.** `playwright.live.config.ts` and `tests/e2e/live/journeys.live.spec.ts` (`npm run test:e2e:live`) contain:
  - the catalog loads from `GET /api/products`, and an aborted request shows the error state;
  - a guest order gets `201` from `POST /api/orders` with the server-side total (999 cents) and the confirmation page;
  - a newly registered account merges a guest cart through `POST /api/cart/merge`, and after a reload (which signs out) signing in again shows the saved cart.
  - Placeholders (`test.fixme`) for the quote and sampler journeys, filled in the closing turn from Students 4 and 5.

  CI job `e2e-live` runs them against `mongo:7.0` and Mailpit, with the seeded catalog and the compiled API serving the built client. The Phase 2 mock checks run as their own job, `e2e-mock`; `playwright.config.ts` ignores `tests/e2e/live`.

- **Step 5, production serving.** `server/src/features/shell/client.ts` (`createClientRouter`):
  - `/api` passes through and keeps its JSON 404;
  - hashed `/assets` files are cached for a year;
  - `/en` and `/es` deep links get `index.html` with `no-cache`; other paths get it with a 404;
  - startup is refused without a build or when the root overlaps `UPLOAD_DIR`.

  It is mounted in `server/src/app.ts` only when `CLIENT_DIST_DIR` is set (Student 1's file: coordinator-approved ownership exception, recorded in handoff proposal 1). Tests: `tests/member-2/client-serving.test.ts`. Also `.env.example` (`CLIENT_DIST_DIR`), `server/src/features/shell/README.md`, and `docs/deployment.md` (status plus the Railway runbook).

## Commands actually run

macOS, Node 24.19.0, 2026-11-12. Docker Desktop was not running, so no local MongoDB.

| Command                                                                                                                              | Result                         | Relevant output or test count                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                                                                                                                      | pass                           | Typecheck; 40 test files passed, 4 skipped; 499 tests passed, 46 skipped (persistence suites, no `TEST_MONGODB_URI`); structure, translation parity and workflow valid |
| `npx vitest run tests/member-1 tests/member-2 tests/member-4 tests/tooling.test.ts` with `.env` `VITE_API_MODE=http`, before the pin | fail                           | 67 failed: unit tests used the HTTP adapters. Fixed by the `vitest.config.ts` pin                                                                                      |
| same, after the pin                                                                                                                  | pass                           | 318 passed, 24 skipped                                                                                                                                                 |
| `npx vitest run tests/member-2/client-serving.test.ts tests/member-2/assets.test.ts`                                                 | pass                           | 21 passed                                                                                                                                                              |
| `npm run check:workflow`                                                                                                             | pass                           | CI baseline valid with the new jobs                                                                                                                                    |
| `npm run check:ownership -- --member 2 --base development`                                                                           | flags `server/src/app.ts` only | the recorded ownership exception                                                                                                                                       |
| `npx playwright test --config playwright.live.config.ts --list`                                                                      | pass                           | 5 tests: 3 journeys, 2 placeholders                                                                                                                                    |
| `npm run test:e2e:live`                                                                                                              | **not run locally**            | needs MongoDB; first run is CI job `e2e-live`                                                                                                                          |
| `docker build .`                                                                                                                     | **not run locally**            | Docker daemon not running; CI job `image` builds it                                                                                                                    |

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

## Known limitations or blocked checks

- Live-API journeys and the image build: CI evidence pending.
- Persistence suites were skipped locally (no Docker); CI runs them on MongoDB.
- Student 1 has not reviewed the `app.ts` change.

## Review

Proposed commit: in progress on `varad-shell`
Reviewer: Krishr21 (D22)
PR:
Integrated commit:
