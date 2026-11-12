# Phase 4 deployment runbook template

This repository has not deployed a completed application. Student 2 coordinates; Student 1 owns DB/secrets/startup, Student 4 durable upload storage, Student 5 SMTP. Select a host capable of running Node and persistent disk, or approve S3 as an alternative. No provider/account/budget has been assumed.

## Phase 2 static demo (live)

The full application below is not deployed yet. The Phase 2 front end is hosted as a static demo:

- URL: https://tambevarad.github.io (GitHub Pages; the repository `tambevarad/tambevarad.github.io` holds only the built files).
- Built from tag `phase-2-submission` with `VITE_API_MODE=mock npx vite build --config vite.config.ts`. Mock mode only: no API, database, uploads or email.
- GitHub Pages has no rewrite rules. Each EN/ES route and product page is a copy of `index.html` (for example `en/catalog.html`) so that it returns 200. `404.html` is the same copy for any other path, which renders the app's not-found page.
- Why GitHub Pages: the uta.cloud account had no hosting space set up, and the professor confirmed that any third-party host is acceptable.
- Verified 28 October 2026 by Varad Tambe: every route returns 200. The Phase 2 audit (every route in EN/ES at 1440 and 375 px, plus signed-in pages) found no console errors, failed requests or overflow on the live URL. Google PageSpeed Insights results are in `docs/phase2/submission/accessibility-report.pdf`.
- To update it, rebuild, recreate the route copies and push to that repository. Phase 4 replaces this demo with the full deployment.

## Current scaffold commands

`npm ci`; `npm run check`; `npm run build`; `npm start`. Build outputs: dist/client and dist/server. `npm start` validates the environment, connects to MongoDB (it exits if it cannot) and serves the API. With `CLIENT_DIST_DIR=dist/client` it also serves the built client and the deep-link fallback (`server/src/features/shell/client.ts`, D22). The `Dockerfile` builds the same thing as one production image. Not deployed yet: see the runbook below.

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
   - `CLIENT_ORIGIN=https://<the app's public domain>`
   - Leave `VITE_WHATSAPP_NUMBER` unset until the business supplies a number.
5. **Networking and health.** Generate a public domain for the app, and set the healthcheck path to `/api/health`.
6. **Demo data.** The seed refuses `NODE_ENV=production`, so run it from your own machine against the demo database only. Enable MongoDB's public TCP proxy, then run `npm run seed:catalog -- "<public MONGO_URL>/solcacao?authSource=admin"`. It upserts the fictional catalog and deletes nothing.
7. **Verify, then fill in the section below.** Check that `/api/health` reports the database connected, that `/es/catalog` survives a refresh, and that `/api/nope` returns JSON. Then run register, sign-in, cart merge, guest checkout, a quote with a PDF, and a sampler enquiry whose email appears in Mailpit. Finally restart the app service and check that the uploaded PDF still downloads.
8. **Rollback.** Railway keeps earlier deployments: open the service's deployments and redeploy the last good one. Data in MongoDB and the volume is untouched.

## Fill after verification

Host/service:
Commit/tag:
Frontend URL:
API health URL:
Mongo environment (name only):
Private storage mount:
SMTP mode:
Deployment command:
Rollback procedure:
Verified by/date:
Known limitations:
