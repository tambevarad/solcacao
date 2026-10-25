# Phase 4 deployment runbook template

This repository has not deployed a completed application. Student 2 coordinates; Student 1 owns DB/secrets/startup, Student 4 durable upload storage, Student 5 SMTP. Select a host capable of running Node and persistent disk, or approve S3 as an alternative. No provider/account/budget has been assumed.

## Current scaffold commands

`npm ci`; `npm run check`; `npm run build`; `npm start` starts the API skeleton. Build outputs: dist/client and dist/server. Current server does NOT serve the SPA and does NOT connect Mongo. Do not describe this skeleton as production-ready.

## Changes required in Phase 4

1. Build client with VITE_API_MODE=http and VITE_API_BASE_URL=/api. Vite public variables are build-time and must never contain secrets.
2. Serve dist/client from Express (or configure separate static host with proxy). Match all /api routes and API404 handler BEFORE any SPA fallback; unknown /api paths must return JSON404, not index.html. Express5 catch-all syntax must be checked against installed version; do not copy legacy '*'.
3. Configure refresh fallback for /en and /es deep links; health is explicit. Ensure dictionary data and approved public assets are in deployed artifacts. Dictionaries are already compiled into dist/server through explicit JSON imports (verified in Phase 2). Public assets can use the unmounted template in server/src/features/shell/assets.ts.
4. Supply server variables PORT, CLIENT_ORIGIN, MONGODB_URI, JWT_SECRET, UPLOAD_DIR and SMTP settings through host secret configuration. Restrict CORS to actual frontend origin. Bind host-assigned PORT.
5. Mount a persistent private disk for UPLOAD_DIR. Verify file survives process restart/redeploy; never host private uploads in dist/client or public static folders.
6. Use actual Mongo service and safe network access settings; create indexes/migrations deliberately. Run explicit synthetic seed only in demo database; never auto-drop on startup.
7. Use Mailpit for development or authorized SMTP configuration for live demonstration. Never silently treat disabled SMTP as sent.
8. Run health/readiness, deep link, auth/cart/quote/contact and restart tests. Record exact commands/results below. Deploy only after the target/account and any costs are authorized.

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
