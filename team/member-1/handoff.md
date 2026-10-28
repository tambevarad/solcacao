# Student 1 handoff

Current phase: 2 (Core Development), ready for review on `aman-auth`. Evidence:
`team/member-1/phase-2-evidence.md`. Phase 1 status is still `not_started` (decision D21).

## Public exports delivered

**Client**

- `client/src/features/auth/public.tsx`: `useAuth(): AuthState` (`user`, `ready`, `login`,
  `register`, `logout`, as specified), `AuthProvider` (already mounted in main.tsx; optional `auth`
  test-seam prop), `RequireAuth`, `RequireRole` (same signatures).
  - Guest → sign-in prompt (modal + `/:locale/login?returnTo=<current path>`).
  - Wrong role → explanation; for `b2b` there is a link to
    `/:locale/register?returnTo=…&role=b2b` plus `/wholesale`.
  - Protected children never render for guests or the wrong role.
- Session behavior:
  - On success the token is written to `sessionToken` **before** `user` changes.
  - `logout()` clears both, with no redirect.
  - The session ends at `expiresAt` (1 h).
  - A reload starts signed out, because the token is memory-only. Mock accounts also reset on reload.
- Auth mock (`client/src/features/auth/mock.ts`):
  - One shared registry for every `createMockAuth()` call.
  - `me()` reads `sessionToken` at call time and throws `ApiError(401,'UNAUTHORIZED')` when signed
    out.
  - Tokens are `mock:<24-hex>`.
  - `resetMockAuth()` is for tests.
  - Fictional demo accounts: `retail@solcacao.test` / `retail-demo-pass` and
    `business@solcacao.test` / `business-demo-pass` (company "Fictional Demo Company").

**Server**

- `server/src/shared/auth.ts`: `requireAuth`, `optionalAuth`, `requireRole(role)`, the `req.user?:
User` augmentation, `signAccessToken`, `createAuthMiddleware({ loadUser, secret, isDatabaseReady })`.
  - `requireRole` authenticates on its own if `requireAuth` did not run.
  - Status codes: 401 for missing/invalid/expired tokens; 403 for the wrong role; 503 when the user
    store is down.
  - Mock tokens are always 401.
- `server/src/shared/db.ts`: `connectDb(uri)`, `disconnectDb()`, `isDatabaseReady()`.
- `server/src/shared/errors.ts`: `AppError`, `ErrorCode`, `invalid`, `sendError`,
  `isDatabaseOutage`, `errorHandler`, `notFoundHandler`.
- `server/src/shared/validation.ts`: `parseBody`.
- `server/src/shared/env.ts`: `loadServerEnv`, `jwtSecretProblems`.
- Routes: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`,
  `PATCH /api/users/me`, `GET|POST /api/users/me/addresses` (`createAuthRouter(deps)`).
- `/api/health` now reports `{status, database}`: 200 when connected, 503 otherwise.

## Required peer exports and PRs

- **Student 3 (catalog):** follow-up in your own files, as your handoff describes:
  `createCatalogRouter({ requireAuth, optionalAuth })` from `../../shared/auth.js`, then delete
  `server/src/features/catalog/types.ts`. The CORS `exposedHeaders` change (your proposal 2) is
  included in this PR's `app.ts`, and so is your `tests/health.test.ts` change.
- **Student 4 (b2b):** `createB2bRouter({ requireAuth, requireB2b: requireRole('b2b'), … })`, then
  delete the duplicate augmentation in `server/src/features/b2b/types.ts`. Your tests need the
  patch in proposal 1 below.
- **Student 5 (support):** `optionalAuth` is available if inquiries ever need the signed-in user.
- **Student 2:** proposals 1–4 below. The shell's account link and sign-out already work against the
  real `useAuth()`.

## Shared change proposals

1. **Student 4, `tests/member-4` (blocks `npm run check` on this branch).** Two tests assert the
   auth stubs. With this exact patch applied, the full suite passes (446 passed, 41 skipped).
   Consumers: tests only; migration: none.

   ```diff
   --- a/tests/member-4/adapters.test.ts
   +++ b/tests/member-4/adapters.test.ts
   @@ -1,7 +1,8 @@
   -import { NotImplementedError } from '../../client/src/api/notImplemented.js';
   +import { sessionToken } from '../../client/src/api/session.js';
   +import { createMockAuth, resetMockAuth } from '../../client/src/features/auth/mock.js';
   @@ -71,9 +72,18 @@
   -  it('asks the auth mock at call time by default (still a template stub)', async () => {
   +  it('asks the auth mock at call time by default', async () => {
   +    resetMockAuth();
   +    sessionToken.set(null);
        const api = createMockB2B(unusedHttp, { delayMs: 0 });
   -    await expect(api.submit(input, pdf())).rejects.toBeInstanceOf(NotImplementedError);
   +    await expect(api.submit(input, pdf())).rejects.toMatchObject({ status: 401 });
   +    const session = await createMockAuth(unusedHttp, { delayMs: 0 }).login({
   +      email: 'business@solcacao.test',
   +      password: 'business-demo-pass',
   +    });
   +    sessionToken.set(session.token);
   +    await expect(api.submit(input, pdf())).resolves.toMatchObject({ status: 'submitted' });
   +    sessionToken.set(null);
      });
   --- a/tests/member-4/fail-closed.test.tsx
   +++ b/tests/member-4/fail-closed.test.tsx
   -// With the template auth (no Student 1 implementation yet) the wizard route must stay closed.
   -it('keeps the wizard closed until real authentication exists', async () => {
   +// With the real RequireRole, a guest gets Student 1's sign-in prompt instead of the wizard.
   +it('keeps the wizard closed for a guest', async () => {
      renderApp('/en/wholesale/request');
   -  expect(await screen.findByText(/role guard implementation pending/)).toBeInTheDocument();
   +  expect(
   +    await screen.findByRole('heading', { level: 1, name: 'Sign in to continue' }),
   +  ).toBeInTheDocument();
   ```

2. **Student 2, `.github/workflows/ci.yml`: MongoDB service for persistence tests.** Add it to the
   test job (members 1, 3 and 4 skip their Mongo suites without it). My suite accepts only a local
   host and uses its own `solcacao_test_member1_<pid>` database. Members 3 and 4 delete their own
   collections, so give them distinct database names if their files run in parallel.

   ```yaml
   services:
     mongo:
       image: mongo:8.0
       ports: ['27017:27017']
       options: >-
         --health-cmd "mongosh --quiet --eval 'db.runCommand({ping:1}).ok'"
         --health-interval 5s --health-timeout 5s --health-retries 20
   env:
     TEST_MONGODB_URI: mongodb://localhost:27017/solcacao_test
   ```

3. **Student 2, `contracts/validation.ts` (contract proposal, no behavior change for consumers).**
   Move `loginSchema`, `profileSchema` and `addressSchema` from `client/src/features/auth/rules.ts`
   into contracts so every endpoint validator lives there (docs/contracts.md asks to "expand runtime
   validators to cover every endpoint in Phase 2"). Old: absent. New: the same exports, unchanged.
   After that, auth/rules.ts re-exports them. Also decide whether `registerSchema.password.min(12)`
   should count bytes (contract text: "12–72 UTF-8 bytes"); today it counts UTF-16 units, which is
   stricter. Tests: tests/member-1/rules.test.ts already covers these.

4. **Student 2, docs (README / `.env.example`) — server start prerequisites.** The API now refuses to
   start without a reachable MongoDB and a real secret. Suggested `.env.example` comment:
   `# JWT_SECRET: at least 32 random characters, e.g. node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
   README "Run the API": `npm run services`, set `MONGODB_URI` and `JWT_SECRET` in `.env`,
   then `npm run dev`. `npm run dev:client` (mock mode) needs neither.

## Known limitations and next step

- The 10 real-Mongo tests (`tests/member-1/persistence.test.ts`: round trip, bcrypt cost, partner
  rollback, concurrent registration, address isolation, address limit) were **not run**: the local
  disk was too full to pull the Mongo image. Run with
  `TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test npx vitest run tests/member-1`
  after `npm run services`, or in CI after proposal 2.
- Registration rollback is compensation, not a transaction. Rate limits need `trust proxy` behind a
  proxy (Phase 4).
- Next (Phase 3, not started): switch to HTTP mode, bind against real Mongo, then do the security
  sweep and the ES/EN audit.
