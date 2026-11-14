# Student 1 Phase 3 evidence

State: ready_for_review (D22 turn, Phases 3 and 4 in one PR). Run by Aman Gulati with Claude Code
on 2026-11-14, on `aman-auth` merged with `origin/development` at `e8d2215` (already up to date, no
conflicts). Every result below comes from a real MongoDB 8.0.38 (Docker `mongo:8.0`) and Mailpit
v1.27 on this machine. No result comes from a mock adapter unless it says so.

## Implemented requirements and changed paths

Playbook steps (team/member-1/phase-3.md):

1. **Real-UI login and register in HTTP mode, StrictMode.** Verified (journey below). No code
   change was needed.
2. **Account, addresses, error translation, reload, logout, in-flight responses.** Verified, with
   two fixes:
   - `client/src/features/auth/pages/AccountPage.tsx`: a 401 signs out only the session the page
     was opened for, so a late 401 cannot sign out an account that signed in since.
   - `client/src/features/auth/AuthProvider.tsx`: the session also ends when the tab becomes
     visible or focused after `expiresAt`, because timers fire late after sleep.
3. **Guest, retail and business entry to the quote wizard; backend refusals with UI guards
   bypassed.** Verified (journey below).
4. **Security review.**
   - `server/src/shared/env.ts` and `server/src/app.ts`: `CLIENT_ORIGIN` is a validated
     comma-separated CORS allowlist, required in production. New `TRUST_PROXY` (proxy hops) makes
     per-IP login, registration and inquiry throttles count clients rather than the proxy.
   - `server/src/shared/errors.ts`: `describeForLog` logs MongoDB errors by name and code only
     (duplicate-key messages quote emails).
   - Findings for other owners, with file:line and fix: `team/member-1/handoff.md`, "Security
     review findings".
5. **Real MongoDB setup and failure states; deployment checklist with secret names only.**
   - `server/src/shared/README.md`: setup, failure states and the variable table.
   - `server/src/features/auth/README.md`: routes, tokens, data, throttles.
   - Deployment checklist: `phase-4-evidence.md`.
6. **Presentation segment:** drafted in `phase-4-evidence.md`.

Also:

- CI flake fix in my tests: `tests/member-1/harness.tsx`, `tests/member-1/pages.test.tsx`.
- New tests:
  - `tests/member-1/security-config.test.ts` (allowlist, production requirement, trust proxy, a
    per-client throttle behind a proxy, safe error logging);
  - a visibility-expiry test in `provider.test.tsx`;
  - a late-401 test in `pages.test.tsx`; the existing 401 test now gets a real adapter 401 instead
    of swapping the stored token.
- Browser journeys: `tests/member-1/auth-journey.live.spec.ts` and
  `deployed-journey.live.spec.ts`, with `tests/member-1/playwright.config.ts`. Not part of
  `npm test` or CI; run instructions are in the config.

Trigger audit: no database triggers are specified. The equivalent rules live in service code plus
indexes:

- the unique `users.email` index decides concurrent registrations (persistence test, and three
  concurrent live registrations gave one 201 and two 409);
- the unique `corporatePartners.userId` index;
- registration compensation deletes the user if the partner insert fails;
- address reads and updates are always filtered by `userId`.

No trigger was invented.

ES/EN audit: no new UI keys this turn. `npm run check:structure` passed translation parity. The ES
wrong-password message ("El correo o la contraseña no son correctos.") was seen on the real API,
locally and live.

## Commands actually run

All with `TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test_ci` set.

| Command                                                                                                    | Result | Relevant output or test count                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git fetch origin && git merge origin/development`                                                         | pass   | "Already up to date" (`e8d2215`)                                                                                                                                           |
| `npm run services`                                                                                         | pass   | `mongo:8.0` and `axllent/mailpit:v1.27` pulled and started (disk 5.2 GB free before, 3.9 GB after)                                                                         |
| `npx vitest run tests/member-1 tests/health.test.ts` (before changes)                                      | pass   | 131 passed, 0 skipped (includes the 10 real-Mongo persistence tests not run in Phase 2)                                                                                    |
| `npm run typecheck`                                                                                        | pass   |                                                                                                                                                                            |
| `npx vitest run tests/member-1 tests/health.test.ts` (after)                                               | pass   | 141 passed, 0 skipped                                                                                                                                                      |
| `npx vitest run tests/member-1/pages.test.tsx tests/member-1/provider.test.tsx`, 5 times                   | pass   | 28/28 each run; no `window is not defined`, no unhandled errors                                                                                                            |
| `npm run check` (final)                                                                                    | pass   | 48 files, 594 passed, 0 skipped; structure and workflow checks pass                                                                                                        |
| `npm run build`                                                                                            | pass   | client and server built                                                                                                                                                    |
| `npm run check:ownership -- --member 1 --base origin/development`                                          | pass   | 15 changed files, all Student 1                                                                                                                                            |
| `npx playwright install chromium`                                                                          | pass   | headless shell 153 (94 MiB)                                                                                                                                                |
| `npm run test:e2e` (mock-mode shell e2e)                                                                   | pass   | 15 passed                                                                                                                                                                  |
| `npm run test:e2e:live` (compiled API + HTTP build + MongoDB + Mailpit, local)                             | pass   | 4 passed, 2 skipped (Student 2's `fixme` quote and sampler journeys, unchanged)                                                                                            |
| `npx playwright test -c tests/member-1/playwright.config.ts auth-journey` (Vite dev HTTP mode, StrictMode) | pass   | 5 passed (after restarting the API: an earlier run hit my own registration limit, 429 `10-in-1hr`, after many test sign-ups; see below)                                    |
| compiled server with a bad config                                                                          | pass   | exit 1 with "CLIENT_ORIGIN is required in production", "entry … must be scheme://host[:port]", "TRUST_PROXY must be …"; unreachable Mongo → "Could not connect to MongoDB" |
| `curl` × 12 failed logins, local                                                                           | pass   | 10 × 401, then 429 `RATE_LIMITED`                                                                                                                                          |
| `curl` 200 kB JSON body / malformed JSON / unknown `/api` path                                             | pass   | 413 `VALIDATION_ERROR` / 400 "Malformed JSON" / JSON 404                                                                                                                   |
| `curl` with `Origin: https://evil.example` / `http://localhost:5173`                                       | pass   | no `Access-Control-Allow-Origin` / echoed back                                                                                                                             |
| `mongosh getIndexes` + `explain` (local)                                                                   | pass   | `users.email` unique, `corporatePartners.userId` unique, `addresses.{userId,_id}`; login and `/me` examine 1 key and 1 document                                            |

## Manual demo observations (real API, real MongoDB, recorded by the journey)

- **Register with a guest cart, in StrictMode.** Request order: `POST /api/auth/register` →
  response → `GET /api/cart [bearer]` → `POST /api/cart/merge [bearer]`.
  - There was exactly one register and one merge. The merge's bearer equals the token in the
    register response, so the token is set before the merge call.
  - MongoDB afterwards: 1 user with that email, 1 cart (`revision 1`, one Peru bar),
    `passwordHash` prefix `$2b$12$`.
  - StrictMode does run `GET /api/users/me/addresses` twice in development (read-only, no
    duplicate write).
  - Sign-in alone: one `POST /api/auth/login` and one `GET /api/cart`, with no merge for an empty
    guest cart.
- **Account.** The new name and one address are stored in MongoDB.
- **Reload.** `/en/account` shows "Sign in to continue".
- **Late response after logout.** `PATCH /api/users/me` was held, then Sign out, then released: the
  server answered 200, and the UI stayed signed out with an empty guest cart.
- **Expiry.** Browser clock advanced 1 h 5 s: sign-in prompt with
  `/en/login?returnTo=%2Fen%2Faccount`. No auth request in the next 5 minutes (no retry loop).
- **Unsafe `returnTo`** (`https://evil.example/`, `//evil.example`, `/en//evil.example`,
  `/%2F%2Fevil.example`): all landed on `/en/account`.
- **Quote wizard entry.** Guest gets "Sign in to continue". Retail gets "Business account
  required". Business gets "Request a custom quote", each after sign-in with `returnTo`.
- **Direct API, no UI.**
  - `POST /api/b2b/quote`: none 401, malformed 401, forged `alg:none` 401, retail 403, owner 201.
  - `GET …/file`: none 401, retail 403, other business 404, owner 200 (`attachment;
filename="brand.pdf"`, `nosniff`). Receipt for another business 404.
  - `/api/auth/me` with no token 401. `PATCH /users/me` with `role` 400. Updating another user's
    address 404.
- **Console.** Only the expected browser log line for the 401 wrong-password response.

Widths, keyboard and EN/ES layout: no UI layout changed this turn. The Phase 2 checks at
375/768/1440 px stand, and the shell e2e (overflow at 375 and 1440 px in EN/ES, keyboard drawer)
passed above.

## Public contract compatibility and peer dependencies

No DTO, route, `docs/api.json` or public hook signature change. Peers used as published: Student
3's cart merge (observed, not changed), Student 4's wizard and quote routes, and Student 2's
production client router. Shared documentation changes go to Student 2 as proposal A in
handoff.md.

## Known limitations or blocked checks

- Nothing was blocked by disk or services. Docker started, and both images fit (3.9 GB free after;
  2.4 GB after the Playwright download).
- The local journey's first full run hit my own registration throttle: 429 `10-in-1hr`, after more
  than 10 test sign-ups from 127.0.0.1 in an hour. That is the limiter working. I restarted the
  local API to reset its in-memory counter and reran: 5 passed.
- Student 2's two `fixme` live journeys stay skipped (not mine).

## Review

Proposed commit: `feat(auth): complete phases 3 and 4 binding, security sweep and live verification`
Reviewer: tambevarad (requested)
PR: https://github.com/tambevarad/solcacao/pull/32 (implementation commit `e192dfc`)
Integrated commit: none yet (recorded by the reviewer after merge)
