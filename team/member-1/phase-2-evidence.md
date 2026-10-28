# Student 1 Phase 2 evidence

State: **ready_for_review** on `aman-auth` (based on `development` @ `3873f6f`). Not integrated;
a reviewer records integration after the PR merges.

Branch note: work started on a local branch named `aman-auth-phase2`, which `npm run agent` rejected
because the roster branch is `aman-auth` (D21: branch mismatches block). `aman-auth` was created at
the same commit, the work was done there, and `aman-auth-phase2` was left unchanged.

Phase 1 note (decision D21): my Phase 1 status is still `not_started` in `status.json`. D21
authorizes Phase 2 anyway; nothing here claims Phase 1 was done or integrated.

## Implemented requirements and changed paths

| Area                          | Paths                                                                                                 | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared rules (F1, F3, B3)     | `client/src/features/auth/rules.ts`                                                                   | Re-exports contract `registerSchema`; adds strict `loginSchema`, `profileSchema`, `addressSchema` (ISO country, postal pattern, optional id, no userId), `fieldErrorsOf`, `normalizeEmail`, `safeReturnTo`. Used by the forms, the mock **and** the Express routes, so client and server accept the same input.                                                                                                                                                                                     |
| Mock adapter (F1)             | `client/src/features/auth/mock.ts`                                                                    | One in-memory registry per tab shared by every `createMockAuth()` call (the B2B mock's `me()` sees the same accounts). Duplicate email → 409, generic 401 for bad credentials, role returned, `mock:<24-hex>` tokens, per-user addresses (other user's id → 404). Two seeded fictional demo accounts. Nothing in localStorage.                                                                                                                                                                      |
| HTTP adapter (B7)             | `client/src/features/auth/http.ts`                                                                    | Exact docs/api.json paths and methods through the shared `HttpClient`.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Provider (F2, F7)             | `client/src/features/auth/AuthProvider.tsx`, `public.tsx`                                             | `user`/`ready`/`login`/`register`/`logout`, as specified. Token goes into `sessionToken` before `user` is set; a generation counter drops responses that arrive after logout; the session ends at `expiresAt`; a full reload starts signed out. No catalog import. Optional `auth` test-seam prop.                                                                                                                                                                                                  |
| Forms, dialog (F3, F6)        | `components/AuthForms.tsx`, `AuthDialog.tsx`, `ErrorSummary.tsx`, `messages.ts`, `AuthPageLayout.tsx` | One LoginForm and one RegisterForm, used by both the routes and the modal (shared `Dialog`). Retail/business radio, company field shown and required for business, no admin. Focusable error summary linked to the fields; errors stored as translation keys so a language switch re-translates them; pending state blocks duplicate submits; after a failure the password is cleared and other fields are kept.                                                                                    |
| Pages (F3, F4)                | `pages/LoginPage.tsx`, `RegisterPage.tsx`, `AccountPage.tsx`                                          | Login/register return to a safe `?returnTo=` (otherwise to /account). The account page shows a clear retail/business card, edits name (and company for business accounts; email is read-only), and lists, adds and edits addresses. A 401 on any action signs the user out so they can sign in again. A mock-mode notice is shown.                                                                                                                                                                  |
| Guards (F5)                   | `public.tsx` `RequireAuth`, `RequireRole` (signatures unchanged)                                      | Guest: sign-in prompt with modal plus a `/login?returnTo=` link. Wrong role: explanation, with a link to register a business account and the wholesale page. Children never render for the wrong role.                                                                                                                                                                                                                                                                                              |
| Dictionaries (F6)             | `client/src/features/auth/locales/{en,es}.json`                                                       | 94 matching `auth.*` keys.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Env + DB (B1)                 | `server/src/shared/env.ts`, `db.ts`, `server/src/index.ts`                                            | `loadServerEnv` requires a mongodb URI and a JWT secret of at least 32 characters that is not a placeholder and not low-entropy; the error never echoes values. `connectDb`/`disconnectDb`/`isDatabaseReady`. Startup validates, connects, builds the auth indexes, then listens; any failure exits 1 with a clear message.                                                                                                                                                                         |
| Models + service (B2, B3, B5) | `server/src/features/auth/models.ts`, `service.ts`                                                    | `users` (unique normalized email, bcrypt cost 12, active), `corporatePartners` (unique userId), `addresses` (userId index); strict schemas. Serializers drop hash/active/_id. On B2B registration the user is deleted again if the partner insert fails (compensation instead of a transaction). Unique-index race → EMAIL_EXISTS. Login costs the same for an unknown email, a wrong password or a password over 72 bytes. Address upsert is constrained by `{_id, userId}`; limit of 20 per user. |
| Middleware (B4)               | `server/src/shared/auth.ts`                                                                           | `requireAuth`, `optionalAuth`, `requireRole(role)`, `req.user` augmentation, `signAccessToken` (HS256, iss `solcacao`, aud `solcacao-web`, sub, role, 1 h). Verifies algorithm/signature/expiry/iss/aud, then loads the current active user (the role comes from storage). `createAuthMiddleware({loadUser})` for tests. Failures always end with an envelope: 401, 403, or 503 if the database is down.                                                                                            |
| Routes (B3, B5)               | `server/src/features/auth/router.ts`                                                                  | `POST /auth/register` (201), `POST /auth/login`, `GET /auth/me`, `PATCH /users/me`, `GET/POST /users/me/addresses`. Bodies are validated before the database is touched; 503 if the database is not ready; `Cache-Control: private, no-store`; rate limits (login: 10 failed attempts per 15 min per IP; register: 10 per hour per IP) → 429 RATE_LIMITED.                                                                                                                                          |
| Errors + app (B6)             | `server/src/shared/errors.ts`, `validation.ts`, `server/src/app.ts`, `tests/health.test.ts`           | Typed `AppError` with every contract code, `parseBody`, shared 404/error handlers (malformed JSON → 400 VALIDATION_ERROR, oversized body → 413; the old non-contract `INVALID_REQUEST` code is gone). Unexpected errors log only name/message, never bodies or tokens. Health returns 503 `disconnected` until connected. CORS exposes the `X-*` pagination headers (Student 3 proposal 2). Existing routers are still mounted.                                                                     |
| Tests (B8)                    | `tests/member-1/*`, `tests/health.test.ts`                                                            | 131 tests: 121 run, 10 real-Mongo tests skipped here (see below). `mongo.ts` refuses non-local, `+srv`, production and app-database URIs, and uses its own `solcacao_test_member1_<pid>` database, which it drops afterwards.                                                                                                                                                                                                                                                                       |

## Commands actually run

Environment: macOS (Darwin 24.6), Node 24.19.0, Docker installed, system disk 98–99% full.

| Command                                                               | Result          | Relevant output or test count                                                                                          |
| --------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `npm run agent -- --member 1 --phase 2`                               | pass            | "Ready to inspect owned implementation" (after moving to `aman-auth`)                                                  |
| `npm run typecheck`                                                   | pass            | client + server                                                                                                        |
| `npx vitest run tests/member-1 tests/health.test.ts`                  | pass            | 8 files; **121 passed, 10 skipped** (`persistence.test.ts` real-Mongo block, no `TEST_MONGODB_URI`)                    |
| `npm run check`                                                       | **fail**        | 444 passed, **2 failed**, 41 skipped. Both failures are Student 4 tests asserting the auth stubs (patch in handoff.md) |
| same suite with the handoff patch applied temporarily (then reverted) | pass            | 32 files; **446 passed, 41 skipped, 0 failed**                                                                         |
| `npm run check:structure` / `check:workflow` (run separately)         | pass            | translation parity valid; roster/CI valid                                                                              |
| `npm run build`                                                       | pass, 1 warning | client chunk 548.63 kB > 500 kB advisory (already in Student 3 proposal 5; Phase 4 code splitting)                     |
| `npm run check:ownership -- --member 1 --base development`            | pass            | all 40 changed files (incl. team/member-1 docs) within Student 1 ownership                                                                        |
| `npx prettier --check` on changed paths                               | pass            |                                                                                                                        |
| compiled server, placeholder `JWT_SECRET`                             | exit 1          | `Invalid server configuration: - JWT_SECRET looks like a placeholder; generate a random value`                         |
| compiled server, no MongoDB on the URI                                | exit 1          | `Could not connect to MongoDB (MongooseServerSelectionError). Start it with npm run services or check MONGODB_URI.`    |
| `docker run mongo:8.0` (throwaway test container)                     | **fail**        | image pull failed: `input/output error`, 167 MiB free on disk. Nothing was deleted to free space                       |
| `TEST_MONGODB_URI=... vitest run tests/member-1/persistence.test.ts`  | **blocked**     | guard tests pass (4); 10 Mongo tests could not connect (no server)                                                     |
| `npm run test:e2e`                                                    | **not run**     | no Playwright browser download possible (disk); visual pass below used installed Google Chrome                         |

## Manual demo observations

Mock mode (`vite`, default `VITE_API_MODE=mock`), driven with Playwright against the installed Google
Chrome (`channel: 'chrome'`, script kept outside the repository), at 375, 768 and 1440 px:

- Business registration with no company: the error summary gets focus, the field is marked invalid,
  and the account is created once the company is filled in. The account page shows "Business account"
  plus a quote link, and an address is added. No horizontal overflow at any width.
- A full reload of `/en/account` shows the sign-in prompt: the session lives in memory only, as
  designed. Sessions do **not** persist across a refresh.
- In ES, a wrong password shows "El correo o la contraseña no son correctos." with the email kept
  and the password cleared.
- A retail account on `/es/wholesale/request` sees "Se requiere una cuenta empresarial" with the
  create-business link, not the wizard.
- Keyboard: Enter opens the auth modal, Escape closes it, and focus returns to the opener (verified
  at every width). The modal sign-in was submitted with Enter.
- 0 browser console errors.
- jsdom tests also cover: switching language on the login form keeps the input and re-translates the
  errors, the error-summary links focus their fields, logout clears token and user, and a 401 on
  profile save goes back to the sign-in prompt.

## Acceptance scenarios

| Scenario                                                                               | Status                                                                                      |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Retail registration → account; business → company validation → business account        | pass (pages.test, visual)                                                                   |
| Duplicate email and incorrect password show recoverable errors                         | pass (pages/adapters tests; HTTP duplicate in persistence test: **not run**, no Mongo)      |
| Required fields, invalid email and 12–72-byte password limits agree with shared schema | pass (rules, pages, api-validation)                                                         |
| Keyboard enter/submit/close auth modal; focus returns to opener                        | pass (pages.test, visual)                                                                   |
| External returnTo rejected; contracts still typecheck                                  | pass                                                                                        |
| Register/login round trip with bcrypt, no plaintext/hash leakage                       | **written, not run** (persistence.test, needs Mongo)                                        |
| Expired/modified/wrong-audience/missing JWT rejected; wrong role → 403                 | pass (middleware.test, 21 tests)                                                            |
| Two users cannot read/write each other's addresses                                     | pass in mock; HTTP/Mongo version **written, not run**                                       |
| Concurrent same-email registration → one account, one conflict                         | **written, not run** (needs Mongo; relies on the unique index built by `ensureAuthIndexes`) |
| Invalid/malformed body → standard envelope; database failure reported truthfully       | pass (health, api-validation: 400/413/503)                                                  |

## Public contract compatibility and peer dependencies

- No change to `contracts/`, `docs/api.json` or routes. `AuthState`, `RequireAuth` and `RequireRole`
  signatures are unchanged (`AuthProvider` gained only an optional `auth` test seam).
- The server imports `client/src/features/auth/rules.ts`, the same pattern catalog uses.
- Peers wire the ports in their own follow-up PRs (see handoff.md); I did not edit catalog/b2b
  routers.

## Known limitations or blocked checks

- **Real-Mongo integration (10 tests) not run locally**: there is no disk space for the Mongo image.
  They must run in CI after the Mongo service patch, or on a machine with Docker.
- Registration rollback is compensation (delete user on partner failure), not a transaction. A
  concurrent login in that window can briefly see a business user without a company.
- Rate limits key on `req.ip`; behind a proxy, `app.set('trust proxy', …)` has to be configured at
  deployment (Phase 4).
- The address limit check (20) is count-then-insert, so heavy concurrency can go slightly over.
- `registerSchema.password.min(12)` counts UTF-16 units, not bytes: six 2-byte letters (12 bytes)
  are rejected. This is stricter than "12 bytes", never looser. It is a contract-owner question (see
  handoff).
- Mock mode: seeded demo credentials are shown on the login page in mock mode only.

## Review

Proposed commit: `feat(auth): Phase 2 auth UI, mock/HTTP adapters, JWT middleware, DB bootstrap and account API`
Reviewer:
PR:
Integrated commit:
