# Student 1 Phase 4 evidence

State: ready_for_review, with host-side checks **pending Varad** (only he has Railway access). Run
by Aman Gulati with Claude Code on 2026-11-14 against the deployed site
https://solcacao-production.up.railway.app (docs/deployment.md). It deploys `development`, so the
live code is `e8d2215` **without this PR's changes**. Each live result below is for that code.
Rerunning after this PR deploys is pending-Varad item 5.

## Implemented requirements and changed paths

1. **Real-HTTP journey repeated on the deployed site:** passed (below). The owned defects found in
   Phase 3 (stale 401, expiry after sleep, CORS allowlist, trust proxy, log redaction) are fixed in
   this PR. See phase-3-evidence.md for the paths.
2. **Assets and queries.** Auth pages have no images (docs/integration.md: "no auth page needs a
   photo"), so there was nothing to compress or lazy-load.
   - Queries measured with `explain` on a real MongoDB: login (`users.email`) and token checks
     (`users._id`) each examine 1 key and 1 document. Addresses use the `{userId, _id}` index plus
     an in-memory sort of at most 20 documents. No index was changed, since there was no measured
     need.
3. **Mobile, keyboard, EN/ES, console (live).** Checked `/login`, `/register`, `/account` and
   `/wholesale/request` at 375, 768 and 1440 px in EN and ES:
   - horizontal overflow 0 everywhere, and `<html lang>` matches the locale;
   - keyboard order at 375 px: skip link, logo, header sign-in, email, password, Sign in, Create an
     account, language switch, navigation;
   - 0 console errors.
4. **Deployment support:** checked from outside (below). Host-side checks are pending Varad.
5. **Documentation:**
   - auth and API notes: `server/src/features/auth/README.md`;
   - database, environment and failure states: `server/src/shared/README.md`;
   - deployment checklist: below;
   - limitations: handoff.md.
6. **Presentation segment:** drafted below. The rehearsal is a human action and not done yet.

## Commands actually run (live)

| Check                                                                             | Result         | Output                                                                                                                                                                                            |
| --------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `curl /api/health`                                                                | pass           | `{"data":{"status":"ok","database":"connected"}}`. The server only listens after config validation, MongoDB connection and `ensureIndexes` succeed, so this is indirect evidence of all three.    |
| `curl -H 'Origin: …' /api/health`                                                 | pass           | `Access-Control-Allow-Origin: https://solcacao-production.up.railway.app` (CLIENT_ORIGIN is set to the deployed origin, exact, no trailing slash). `Origin: https://evil.example` is not granted. |
| 3 concurrent `POST /api/auth/register`, same email                                | pass           | 201, 409, 409: the unique email index is active on the live database                                                                                                                              |
| login with the email upper-cased; decode the token (no secret)                    | pass           | header `{"alg":"HS256","typ":"JWT"}`; claims `role`, `iat`, `exp`, `aud: solcacao-web`, `iss: solcacao`, `sub`; `exp − iat = 3600`                                                                |
| failed login headers                                                              | pass           | 401 generic message; `RateLimit: "10-in-15min"`                                                                                                                                                   |
| security headers on `/en`                                                         | pass           | CSP `default-src 'self'` …, HSTS, `nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: no-referrer`, COOP same-origin                                                                      |
| secret scan: live entry scripts, the full local `dist/client`, and the repository | pass           | no `JWT_SECRET`, `SMTP_PASS`, `MP_UI_AUTH` or `mongodb://` in the client; the only repository match is CI generating a random secret                                                              |
| `npx playwright test -c tests/member-1/playwright.config.ts deployed`             | pass, 2 passed | journey and access control below                                                                                                                                                                  |
| live widths, EN/ES, keyboard and console script (Playwright, 24 page views)       | pass           | overflow 0, lang correct, 0 console errors                                                                                                                                                        |

## Manual demo observations (deployed site)

- **Guest cart, then register** (`m1-retail-…@example.test`, fictional). Requests:
  `POST /api/auth/register` → response → `GET /api/cart [bearer]`, `GET /api/users/me/addresses
[bearer]` → `POST /api/cart/merge [bearer]`.
  - There was one register and one merge, and the merge carried the token from the register
    response.
  - The cart kept 1 item (`revision 1`).
- **Profile and address.** Read back through a fresh API login: name "M1 Live Renamed", 1 address.
  The user DTO keys are `id,name,email,role` (no hash). `expiresAt` was 60 minutes ahead.
- **Reload:** sign-in prompt. **Late `PATCH /api/users/me` after logout:** 200 from the server; the
  UI stayed signed out and the guest cart was empty.
- **Wizard entry:** guest gets the sign-in prompt, retail gets "Business account required",
  business gets "Request a custom quote".
- **ES wrong password:** "El correo o la contraseña no son correctos."
- **Access control, direct API:**
  - quote POST: none 401, forged `alg:none` 401, retail 403, owner 201 (one fictional quote,
    marked "Member 1 Phase 4 access-control check");
  - its file: none 401, retail 403, other business 404, owner 200 (`attachment;
filename="brand.pdf" | nosniff | private, no-store`);
  - `me`: none 401, retail 200;
  - escalation and tampering: `role` in a profile update 400, `role: admin` at registration 400,
    another user's address 404.

Test data added to the live demo database (all fictional `@example.test`): about 10 accounts, 2
addresses, 1 cart, and 1 quote with a 60-byte PDF, which sent one notification to the Mailpit demo
inbox.

## Deployment checklist (names only; values are entered by Varad in Railway)

| Item                                                                  | Who / status                                                                                |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `MONGODB_URI` (references `MongoDB.MONGO_URL`)                        | set: the health check shows `connected`. Name check in the dashboard: pending-Varad         |
| `JWT_SECRET` (random, 32+ characters)                                 | set and valid: the server refuses to start otherwise. Name check: pending-Varad             |
| `CLIENT_ORIGIN` (deployed origin; list allowed)                       | set: verified from the CORS header. Required in production from this PR on                  |
| `TRUST_PROXY=1`                                                       | **new; pending-Varad** after merge (finding 1 in handoff.md)                                |
| `PORT`                                                                | set by Railway (public port 8080 per docs/deployment.md)                                    |
| `NODE_ENV=production`, `CLIENT_DIST_DIR`                              | set by the Dockerfile                                                                       |
| `UPLOAD_DIR` on the `/data` volume                                    | Student 4 (verified in his turn)                                                            |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `MAIL_FROM`, `SUPPORT_EMAIL` | Student 5 (verified in his turn)                                                            |
| MongoDB public TCP proxy disabled after seeding                       | pending-Varad (dashboard)                                                                   |
| Startup log, no PII or token in logs, no rate-limit warnings          | pending-Varad (Railway logs)                                                                |
| Live indexes (`getIndexes`)                                           | pending-Varad. Indirect evidence: the unique email index rejects concurrent duplicates live |
| Redeploy after this PR, then rerun `deployed` journey                 | pending-Varad (redeploy), then anyone can rerun the spec                                    |

## Presentation segment draft (Student 1, about 4 minutes)

1. **Architecture and auth (1 minute).**
   - One Express API serves the React build.
   - Startup validates the configuration, connects to MongoDB, builds the indexes, then listens. A
     weak secret or an unreachable database stops it with a clear message.
   - Accounts: `users` (unique email, bcrypt cost 12), `corporatePartners` (business company) and
     `addresses` (always filtered by the signed-in user).
   - Tokens: an HS256 JWT for one hour, checked for signature, issuer, audience and expiry, and the
     role is always re-read from the database. The browser keeps the token in memory only, so a
     reload signs out by design (D09).
2. **Successful flow, live (1.5 minutes).**
   - Add a bar to the cart as a guest, then register on `/en/register`.
   - In DevTools Network, point out that the merge request carries the new token and happens once,
     and the cart keeps its item.
   - Edit the profile, add an address, switch to Spanish and back.
   - Reload: the account page asks for sign-in again. Sign in with `?returnTo` and land back on
     the page.
3. **Access-control failure, live (1 minute).** With a **retail** account signed in, open
   `/en/wholesale/request`: "Business account required". Then show that the server enforces it
   even with the UI bypassed:

   ```sh
   S=https://solcacao-production.up.railway.app
   TOKEN=$(curl -s -X POST -H 'Content-Type: application/json' \
     -d '{"email":"<retail demo email>","password":"<its password>"}' $S/api/auth/login \
     | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.token')
   curl -s -X POST -H "Authorization: Bearer $TOKEN" -F metadata='{}' $S/api/b2b/quote   # 403 FORBIDDEN
   curl -s $S/api/auth/me                                                                # 401 UNAUTHORIZED
   ```

   Expected (seen live on 2026-11-14): `{"error":{"code":"FORBIDDEN",…}}` and
   `{"error":{"code":"UNAUTHORIZED",…}}`, with no stack trace.

4. **Security sweep (30 seconds).**
   - Login throttle: 10 failures per 15 minutes, with `RateLimit` headers.
   - A CORS allowlist of the deployed origin; strict bodies (a `role` in a profile update is 400);
     a 100 kB body limit.
   - Logs never contain bodies, tokens or MongoDB messages.
   - Name one finding sent to a teammate, and the `TRUST_PROXY` fix.

The rehearsal and the timing are not done yet; they are a human action in the team rehearsal.

## Public contract compatibility and peer dependencies

No contract change. Host access belongs to Student 2 (pending-Varad items in handoff.md).
Uploads (Student 4) and mail (Student 5) were exercised only as far as the access checks needed.

## Known limitations or blocked checks

- **Pending Varad:**
  - the Railway variable names in the dashboard;
  - setting `TRUST_PROXY=1`;
  - the logs;
  - the live `getIndexes`;
  - the MongoDB TCP proxy state;
  - a redeploy after this PR, then the `deployed` journey rerun.
- The live checks ran on `e8d2215`, before this PR. Its fixes are verified locally only, until the
  redeploy.
- Not done: the presentation rehearsal and peer PR review for this phase (human actions).

## Review

Proposed commit: `feat(auth): complete phases 3 and 4 binding, security sweep and live verification`
Reviewer: tambevarad (requested)
PR: see status.json
Integrated commit: none yet
