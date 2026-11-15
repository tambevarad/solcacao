# Student 1 handoff

Current turn: Phases 3 and 4 together (D22), the last member turn before Student 2's closing turn.
Branch `aman-auth`. Evidence: `team/member-1/phase-3-evidence.md` and `phase-4-evidence.md`.
Author: Aman Gulati, who authorized commit, push and the PR into `development` on 2026-11-14.
PR: https://github.com/tambevarad/solcacao/pull/32 (`e192dfc`). Reviewer requested: tambevarad. No approval is claimed here.

## Start of turn: merge and peer reports

- `git fetch origin` then `git merge origin/development`: "Already up to date". `aman-auth` was
  already at `e8d2215` (PR #31 merged), so there were **no merge conflicts** and nothing was
  resolved by judgement.
- Sign-in problems reported by teammates, and what changed in my files:
  - **CI flake, `window is not defined`** (`docs/weekly/week-4.md:78`,
    `team/member-2/phase-2-evidence.md:134`). Cause: `tests/member-1/harness.tsx` mounted
    `CartProvider` with the default catalog mock, which has 250 ms of demo latency. A test that
    signs in ends while the cart's sign-in load and merge are still waiting. When that was the
    file's last test, the timer fired after jsdom was torn down. Fix (my test files only): the
    harness passes `createMockCatalog(unusedHttp, { delayMs: 0 })` through `CartProvider`'s
    documented `catalog` test seam. `pages.test.tsx`'s `afterEach` lets pending work settle inside
    `act` before `cleanup()`. No change to Student 3's `CartProvider`; as Student 2 noted, an unmount
    guard there would break the StrictMode remount.
  - **Timing flake in `pages.test.tsx › registration`** (Student 3, `team/member-3/handoff.md:114`):
    `configure({ asyncUtilTimeout: 3000 })`, the remedy Student 3 suggested. Assertions unchanged.
  - **Session end unmounts the quote wizard** (Student 4, `team/member-4/phase-3-evidence.md:20`).
    Student 4 fixed it in his own files. On my side I found two related gaps and fixed them in my
    files:
    1. A late 401 from the account page could sign out an account that signed in since.
       `AccountPage` now signs out only the session it was opened for.
    2. The one-hour expiry timer can fire late after a laptop sleeps. `AuthProvider` now also
       re-checks `expiresAt` when the tab becomes visible or focused.
  - Students 3 and 5 reported no sign-in failure.

## Review of the coordinator-approved change to my `server/src/app.ts` (PR #27, proposal 1 in team/member-2/handoff.md)

**I agree with it as merged; no change requested.** Checked:

- It mounts `createClientRouter` after all five `/api` routers and before `notFoundHandler`, only
  when `CLIENT_DIST_DIR` is set. Development, CI unit tests and `tests/health.test.ts` are unchanged.
- Unknown `/api` paths still reach my JSON 404 (`next('router')` in
  `server/src/features/shell/client.ts`). Verified locally and on the live site: `/api/nope` → JSON 404.
- Refusing to start when the client root overlaps `UPLOAD_DIR` keeps private uploads out of static
  serving.
- Note only, not a change request: a missing build throws while `app.ts` is imported, so it prints a
  stack trace instead of my "Invalid server configuration" message. It still exits non-zero, which
  is what matters for the host.

In this turn I edited the lines around it (trust proxy, CORS allowlist). The mount itself is
untouched.

## Public exports (unchanged signatures)

Client: `useAuth`, `AuthProvider`, `RequireAuth`, `RequireRole` (`client/src/features/auth/public.tsx`).
Server: `requireAuth`, `optionalAuth`, `requireRole`, `signAccessToken`, `connectDb`,
`isDatabaseReady`, `ensureIndexes`, `AppError`, `sendError`, `errorHandler`, `parseBody`,
`loadServerEnv`. Added: `describeForLog(error)` in `server/src/shared/errors.ts` (safe log line),
and `parseClientOrigins` / `parseTrustProxy` in `server/src/shared/env.ts`. No DTO, route or
`docs/api.json` change.

New server configuration (names only):

- `CLIENT_ORIGIN` now accepts a comma-separated allowlist and is required when
  `NODE_ENV=production`. The live server already sends
  `Access-Control-Allow-Origin: https://solcacao-production.up.railway.app`, so it is set there.
- `TRUST_PROXY` (new, default 0) is the number of proxy hops.

## Security review findings for other owners (review only; I did not edit their code)

Each finding names the file:line and the fix. Severity is mine.

1. **Student 2 (Varad), Railway variable: pending-Varad, medium.** The API sits behind Railway's
   proxy without `trust proxy`, so the per-IP limits (login and registration in my router,
   `/inquiries` in Student 5's) can treat every visitor as one address. Ten failed logins anywhere
   would then lock everyone out for 15 minutes. Fix: after this PR deploys, set `TRUST_PROXY=1` on
   the `solcacao` service. Then check the logs for express-rate-limit
   `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` warnings, before and after.
2. **Student 2, `docs/deployment.md:45` and `.env.example:3` (proposal A below), low.** Document
   `TRUST_PROXY=1` and the CLIENT_ORIGIN list format.
3. **Student 3 (Reethika), `server/src/features/catalog/router.ts:165`, low.**
   `console.error('[catalog] Unexpected error', error)` logs the whole error: the stack, plus
   MongoDB messages that can quote stored values. Fix:
   `import { describeForLog } from '../../shared/errors.js';` then
   `console.error('[catalog] Unexpected error:', describeForLog(error));`.
4. **Student 3, `server/src/features/catalog/router.ts:148`, low.** `POST /api/orders` (guest
   checkout) has no rate limit, so anyone can create unlimited simulated orders and grow the
   database. Fix: `authRateLimit({ windowMs: 15 * 60 * 1000, limit: 20 })` from
   `../auth/router.js`, or an equivalent `rateLimit` before `optionalAuth`.
5. **Student 4 (Krish), `server/src/features/b2b/router.ts:151` and
   `server/src/features/b2b/service.ts:116`, low.** The same full-error logging; at `service.ts:116`
   it can include SMTP transport details. Fix: `describeForLog(error)` as in finding 3.
6. **Student 4, `server/src/features/b2b/router.ts:107`, low.** `POST /api/b2b/quote` has no throttle.
   Every request buffers up to 5 MiB in memory before validation, so one business account can send
   many in parallel. Fix: a per-user limiter after `requireB2b`, for example
   `rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, keyGenerator: (req) => req.user!.id })`.
   Keep it before `parseUpload`.
7. **Student 5 (Daniel), `server/src/features/support/router.ts:25`, nit.** The route-level
   `express.json({ limit: '16kb' })` never runs, because `app.ts` has already parsed the body with
   its 100 kB limit. The 16 KiB rule still holds through the explicit check at line 28, so behaviour
   is correct. Fix: drop the route parser, or note in `server/src/features/support/README.md` that
   line 28 enforces the limit.

Checked with no finding:

- JWT handling: HS256 only, `iss`/`aud`/`exp` verified, role from the database, `alg: none`
  rejected (live: 401).
- Quote and file ownership (live: 401/403/404 as specified). Download headers: attachment,
  `nosniff`, `private, no-store`.
- No other `returnTo` consumers. No tokens in `localStorage`.
- Error envelopes carry no stack traces. Helmet CSP and HSTS are live. No secrets in the client
  bundle or the repository.

## Shared change proposals

A. **Student 2, `.env.example` and `docs/deployment.md` (docs only; no contract change).**

```diff
--- a/.env.example
-CLIENT_ORIGIN=http://localhost:5173
+# CORS allowlist: one origin or a comma-separated list (scheme://host[:port], no path). Required in production.
+CLIENT_ORIGIN=http://localhost:5173
+# Reverse-proxy hops in front of the API (1 on Railway) so per-IP rate limits see the client. 0 locally.
+# TRUST_PROXY=0
--- a/docs/deployment.md (Railway runbook step 4)
    - `CLIENT_ORIGIN=https://<the app's public domain>`
+   - `TRUST_PROXY=1` (Railway's edge proxy; without it every visitor shares one rate-limit bucket)
```

Earlier proposals: 1, 2 and 4 landed in PR #12. Proposal 3 (auth schemas into
`contracts/validation.ts`) is still deferred by the coordinator, with no behaviour change.

## Pending Varad (Railway access only)

1. Set `TRUST_PROXY=1` on the `solcacao` service once this PR is merged and deployed. Then redeploy
   and confirm that `/api/health` still reports `connected`.
2. Confirm in the dashboard (names only) that `JWT_SECRET`, `MONGODB_URI`, `CLIENT_ORIGIN` and
   `UPLOAD_DIR` are set as host variables. The running server shows indirectly that `JWT_SECRET`
   passed my startup validation: 32 or more characters, not a placeholder.
3. Railway logs: the startup line `SolCacao API listening`, no `Could not connect to MongoDB`, no
   rate-limit `ERR_ERL_*` warnings, and no email addresses or tokens in any log line.
4. MongoDB indexes on the live database (`users.email` unique, `corporatePartners.userId` unique,
   `addresses.{userId,_id}`). Use `db.users.getIndexes()` and the others through Railway's data tab
   or a short-lived TCP proxy, then disable the proxy again. Indirect evidence already: three
   concurrent registrations with one email gave one 201 and two 409.
5. After the redeploy, rerun
   `npx playwright test -c tests/member-1/playwright.config.ts deployed`.

## Known limitations

- Registration rollback is compensation, not a transaction (no replica set on the demo host).
- The address limit (20) is a count followed by an insert. Two concurrent creates at 19 could reach 21. No contract requires atomicity there.
- Rate limits live in each process's memory, so they reset on every redeploy or restart.
- The token lives in memory only (D09): every reload asks for sign-in again, by design.
