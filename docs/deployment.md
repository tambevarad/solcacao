# Phase 4 deployment runbook template

The full application is deployed on Railway at https://solcacao-production.up.railway.app (runbook and verified results below; D22). Student 2 coordinates; Student 1 owns DB/secrets/startup, Student 4 durable upload storage, Student 5 SMTP.

## Phase 2 static demo (live)

The Phase 2 front end is still hosted separately as a static mock-mode demo:

- URL: https://tambevarad.github.io (GitHub Pages; the repository `tambevarad/tambevarad.github.io` holds only the built files).
- Built from tag `phase-2-submission` with `VITE_API_MODE=mock npx vite build --config vite.config.ts`. Mock mode only: no API, database, uploads or email.
- GitHub Pages has no rewrite rules. Each EN/ES route and product page is a copy of `index.html` (for example `en/catalog.html`) so that it returns 200. `404.html` is the same copy for any other path, which renders the app's not-found page.
- Why GitHub Pages: the uta.cloud account had no hosting space set up, and the professor confirmed that any third-party host is acceptable.
- Verified 28 October 2026 by Varad Tambe: every route returns 200. The Phase 2 audit (every route in EN/ES at 1440 and 375 px, plus signed-in pages) found no console errors, failed requests or overflow on the live URL. Google PageSpeed Insights results are in `docs/phase2/submission/accessibility-report.pdf`.
- To update it, rebuild, recreate the route copies and push to that repository. Phase 4 replaces this demo with the full deployment.

## Current scaffold commands

`npm ci`; `npm run check`; `npm run build`; `npm start`. Build outputs: dist/client and dist/server. `npm start` validates the environment, connects to MongoDB (it exits if it cannot) and serves the API. With `CLIENT_DIST_DIR=dist/client` it also serves the built client and the deep-link fallback (`server/src/features/shell/client.ts`, D22). The `Dockerfile` builds the same thing as one production image, which is what Railway runs.

## Changes required in Phase 4

1. Build client with VITE_API_MODE=http and VITE_API_BASE_URL=/api. Vite public variables are build-time and must never contain secrets.
2. Serve dist/client from Express (or configure separate static host with proxy). Match all /api routes and API404 handler BEFORE any SPA fallback; unknown /api paths must return JSON404, not index.html. Express5 catch-all syntax must be checked against installed version; do not copy legacy '*'.
3. Configure refresh fallback for /en and /es deep links; health is explicit. Ensure dictionary data and approved public assets are in deployed artifacts. Dictionaries are already compiled into dist/server through explicit JSON imports (verified in Phase 2). Public assets can use the unmounted template in server/src/features/shell/assets.ts.
4. Supply server variables PORT, CLIENT_ORIGIN, MONGODB_URI, JWT_SECRET, UPLOAD_DIR and SMTP settings through host secret configuration. Restrict CORS to actual frontend origin. Bind host-assigned PORT.
5. Mount a persistent private disk for UPLOAD_DIR. Verify file survives process restart/redeploy; never host private uploads in dist/client or public static folders.
6. Use actual Mongo service and safe network access settings; create indexes/migrations deliberately. Run explicit synthetic seed only in demo database; never auto-drop on startup.
7. Use Mailpit for development or authorized SMTP configuration for live demonstration. Never silently treat disabled SMTP as sent.
8. Run health/readiness, deep link, auth/cart/quote/contact and restart tests. Record exact commands/results below. Deploy only after the target/account and any costs are authorized.

Done in Student 2's first Phase 3/4 PR (D22): items 1 to 3. The `Dockerfile` builds the client with `VITE_API_MODE=http` and `VITE_API_BASE_URL=/api`; `createClientRouter` serves it after the `/api` routers with a deep-link fallback, and unknown `/api` paths keep the JSON 404. CI builds the image and runs the live-API browser journeys (`npm run test:e2e:live`). Items 4 to 8 happen on the host, below.

## Railway runbook (host chosen 2026-11-12)

Railway's Hobby plan ($5 a month including $5 of usage; check railway.com/pricing) runs the app, MongoDB and Mailpit in one project, with a volume for uploads. Varad creates the account, pays, and enters every secret; nobody else needs access. Railway builds the root `Dockerfile` automatically. Its older `railway.json` config file is deprecated, so all settings below go in the dashboard.

1. **Project.** New project, then "Deploy from GitHub repo" `tambevarad/solcacao`. Deploy `development` while testing, and switch the service to `main` for the final release.
2. **MongoDB.** "+ New", Database, MongoDB. Railway creates the `MONGO_URL` variable on that service.
3. **Mailpit (demo inbox).** "+ New", Docker Image `axllent/mailpit:v1.27`, with variables `MP_SMTP_BIND_ADDR=[::]:1025`, `MP_UI_BIND_ADDR=[::]:8025` and `MP_UI_AUTH=demo:<a password you choose>`. Give it a public domain on port 8025, so the inbox can be shown in the demo behind that password. SMTP stays on the private network.
4. **App service variables.** Railway sets `PORT`.
   - `MONGODB_URI=${{MongoDB.MONGO_URL}}/solcacao?authSource=admin`
   - `JWT_SECRET`: 64 random hex characters from `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`, run on your own machine
   - `UPLOAD_DIR=/data/uploads`, with a volume on the app service mounted at `/data`
   - `SMTP_HOST=${{Mailpit.RAILWAY_PRIVATE_DOMAIN}}`, `SMTP_PORT=1025`, `SMTP_SECURE=false`, `MAIL_FROM=solcacao@example.test`, `SUPPORT_EMAIL=support@example.test`
   - `CLIENT_ORIGIN=https://<the app's public domain>` (one origin, or a comma-separated list, each exactly `scheme://host[:port]` with no path; required in production)
   - `TRUST_PROXY=2`: the number of proxies in front of the app, so the per-IP rate limits (login, registration, enquiries) see each visitor. 2 was measured on this host (see "Proxy hops" below); 1, the value in Student 1's notes, keys the limits on a changing Railway proxy address.
   - Leave `VITE_WHATSAPP_NUMBER` unset until the business supplies a number.
5. **Networking and health.** Generate a public domain for the app, and set the healthcheck path to `/api/health`.
6. **Demo data.** The seed refuses `NODE_ENV=production`, so run it from your own machine against the demo database only. Enable MongoDB's public TCP proxy, then run `npm run seed:catalog -- "<public MONGO_URL>/solcacao?authSource=admin"`. It upserts the fictional catalog and deletes nothing.
7. **Verify, then fill in the section below.** Check that `/api/health` reports the database connected, that `/es/catalog` survives a refresh, and that `/api/nope` returns JSON. Then run register, sign-in, cart merge, guest checkout, a quote with a PDF, and a sampler enquiry whose email appears in Mailpit. Finally restart the app service and check that the uploaded PDF still downloads.
8. **Rollback.** Railway keeps every earlier deployment with its image and variables. In the `solcacao` service, open Deployments, choose the last good deployment, open its ⋮ menu and choose Rollback. Railway starts it, waits for `/api/health`, then switches traffic. To return to the newest deployment, roll back to it the same way. Data in MongoDB and the volume is untouched. Check afterwards: `/api/health` reports the database connected, and `TRUST_PROXY` in the service's Variables still has the value you expect.

## Fill after verification

Host/service: Railway (Hobby plan), project `innovative-unity`, environment `production`. Services: `solcacao` (this repo's Dockerfile), `MongoDB` (Railway MongoDB template, mongo 8.0), `Mailpit` (`axllent/mailpit:v1.27`).
Commit/tag: Railway deploys the head of the service's branch. The first checks below were run on `934ea77` (`varad-shell`, PR #27); the later commits on that PR changed docs only. Since #27 merged, the service deploys `development` (first `62e52e4`). The closing-turn checks were run on `3e0c1f1` (PR #32, every member turn merged). Switch the service to `main` for the final release.
Frontend URL: https://solcacao-production.up.railway.app (the API serves the client; public port 8080).
API health URL: https://solcacao-production.up.railway.app/api/health → `{"data":{"status":"ok","database":"connected"}}`
Mongo environment (name only): Railway `MongoDB` service, database `solcacao`, reached over the private network (`MONGODB_URI` references `MONGO_URL`). Volume `mongodb-volume`, 5 GB. On the trial plan's 500 MB volume, MongoDB refused every write: it requires 500 MiB free. Public TCP access is removed after seeding; re-enable it briefly only to re-seed.
Private storage mount: volume `solcacao-volume` at `/data`, with `UPLOAD_DIR=/data/uploads`. It is not under the client root (startup refuses an overlap).
SMTP mode: Mailpit on the private network (`SMTP_HOST` references `Mailpit.RAILWAY_PRIVATE_DOMAIN`, port 1025). The demo inbox is https://mailpit-production-29902785.up.railway.app, behind `MP_UI_AUTH`; the Mailpit service sets `PORT=8025` so its domain routes to the inbox.
Deployment command: automatic on push to the service's branch; `railway redeploy --service solcacao` reuses the last build.
Rollback procedure: runbook step 8 (Deployments, the last good deployment, ⋮, Rollback; roll back to the newest deployment the same way to return). MongoDB and volume data are untouched. Not yet rehearsed on this host: see the closing-turn results below.
Proxy variables: `TRUST_PROXY=2` and `CLIENT_ORIGIN=https://solcacao-production.up.railway.app`.
Verified by/date: Varad Tambe (with Claude Code), 2026-11-13. Results:

- the catalog seeded from a local machine (`seed:catalog`, 15 fixtures, 14 active);
- every `/en` and `/es` deep link returns 200; `/fr/catalog` returns 404 with the app; `/api/nope` and a missing asset return JSON 404s;
- `/api/i18n/es` returns 574 keys; `/api/products` returns 14 in total;
- security headers (CSP, HSTS, nosniff) are present;
- in the browser, a guest order gives `POST /api/orders` 201 (demo receipt, $9.99) and the cart empties;
- a six-piece sampler enquiry gives `POST /api/inquiries` 201: "Your enquiry has been saved… The enquiry notification was sent." That is the app's report that Mailpit's SMTP accepted the message. The live inbox itself was not opened, because it needs the Mailpit password (runbook step 7); delivery to the inbox is checked in CI by the live contact-enquiry journey;
- after a redeploy, health still reports the database connected and all 14 products remain.

Each member then repeated their own journey on this host in their D22 turn (their `phase-4-evidence.md`): Student 4's quote PDF downloads byte-identical after a redeploy, Student 5's enquiry email arrives in the live inbox, Student 3's retail journey and Student 1's sign-in, access-control and concurrent-registration checks pass.

### Closing-turn results (Student 2, 2026-11-14, on `3e0c1f1`)

- **Variables (names only):** `CLIENT_ORIGIN`, `JWT_SECRET`, `MONGODB_URI`, `PORT`, `UPLOAD_DIR`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `MAIL_FROM`, `SUPPORT_EMAIL` and `TRUST_PROXY` are set on `solcacao`. Startup passes Student 1's configuration check: the log shows `SolCacao API listening on :8080`. MongoDB has no public TCP proxy. Mailpit has one on its inbox port 8025, behind the inbox password; SMTP stays private.
- **Logs:** the last 400 lines contain no email address and no token. Before PR #32 they showed `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` 9 times: the proxy forwards `X-Forwarded-For`, which the app ignored.
- **Proxy hops:** measured with empty `POST /api/auth/register` requests (each gets 400 and creates nothing; the `RateLimit` header shows the attempts left in that request's bucket). From one unchanging client address and one app replica:

  | `TRUST_PROXY` | Four plain requests     | With spoofed `X-Forwarded-For` / `X-Real-IP` | Meaning                                             |
  | ------------- | ----------------------- | -------------------------------------------- | --------------------------------------------------- |
  | 1             | 9, 9, 8, 8: two buckets | no new bucket                                | keyed on a changing proxy address, not the visitor  |
  | 2             | 9, 8, 7, 6: one bucket  | 5, 4, 3: still that bucket                   | one bucket per visitor; a fake header cannot escape |

  Railway does not publish its hop count, so repeat this check if the value or the host's networking changes. It was run from one network only.

- **Read-only sweep of every route** in EN and ES at 1440 and 375 px (68 page loads, the mobile menu and the cart drawer; nothing submitted): no horizontal overflow, missing translation, wrong `lang` or extra `h1`, and no failed request. The only console message is the browser reporting the intended 404 status of `/en/no-such-page` and `/es/no-such-page`.
- **Live journeys on this host:** `tests/e2e/live` "the catalog comes from the live API…" and "a guest order is created…" pass against https://solcacao-production.up.railway.app (Chrome, `LIVE_BASE_URL`). The journeys that register accounts or read the password-protected inbox (cart merge, contact, quote, sampler) are run by Varad, with `MAILPIT_URL` and `MAILPIT_AUTH`; see "Run the live journeys on this host" below.
- **Lighthouse 13.6** (local Chrome, default mobile and desktop presets) on six live pages: accessibility 100, SEO 100 and best practices 96 on every page. The 96 is one Chrome "Issues" entry: zod (client-side validation) probes once for `eval` with `Function('')` inside a `try`; the CSP's `script-src 'self'` blocks it, as intended, and zod uses its non-compiled path. Nothing fails and no console error is logged. Silencing it needs `z.config({ jitless: true })` before any schema is built, which the bundled chunk order does not allow without an alias for `zod`, so it is left as is. Performance and layout shift:

  | Page                            | Mobile perf | Mobile CLS | Desktop perf | Desktop CLS |
  | ------------------------------- | ----------- | ---------- | ------------ | ----------- |
  | `/en`                           | 94          | 0          | 100          | 0           |
  | `/en/catalog`                   | 94          | 0.14       | 90           | 0.213       |
  | `/es/products/peru-85-dark-bar` | 71          | 0.529      | 96           | 0.123       |
  | `/es/wholesale`                 | 69          | 0.576      | run failed   | —           |
  | `/en/sampler`                   | 76          | 0.708      | 80           | 0.447       |
  | `/es/contact`                   | 79          | 0.506      | 96           | 0.13        |

  The shifting element was the footer: pages load on demand, so it painted beside the short loading state and moved when the page arrived. The closing-turn PR makes `<main>` at least one screen tall. On a production build served locally, mobile CLS fell from 0.40–0.66 to 0–0.09 on the catalog, product, wholesale and sampler pages (performance +17 to +23), and desktop CLS from 0.15–0.44 to 0–0.12. The remaining 0.12 on the sampler is its product list growing after the products load (Student 5's proposal in `team/member-2/handoff.md`). Re-measure on this host after the release deploys.

### Run the live journeys on this host

From the repository, after `npx playwright install chromium`. The inbox password is Mailpit's `MP_UI_AUTH`; type it only in your own terminal. The journeys register two fictional `@example.test` accounts, within the 10-per-hour registration limit.

```bash
LIVE_BASE_URL=https://solcacao-production.up.railway.app MAILPIT_URL=https://mailpit-production-29902785.up.railway.app MAILPIT_AUTH='demo:<inbox password>' npx playwright test --config playwright.live.config.ts
```

Known limitations:

- The rollback in step 8 has not been rehearsed on this host yet.
- The demo inbox and database are fictional demo data only.
