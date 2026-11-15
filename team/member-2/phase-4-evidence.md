# Student 2 Phase 4 evidence

State: turn 1 integrated (PR #27 merged as 62e52e4, follow-up #28 as 13a60a2); closing turn ready for review in PR #33. Deployed on Railway: https://solcacao-production.up.railway.app

## Implemented requirements and changed paths

- **Step 2, bundle.** `client/src/routes.tsx` loads every page except the homepage and not-found on first visit (`React.lazy`), behind a `Suspense` loading state inside `PageFrame`, so a failed page chunk shows the page error state.
- **Step 2, images.** The shared photo library was measured and needed no change: 61 images, none over 250 kB (2.6 MB in total across all sizes), each served with `srcset`, `width`/`height`, `loading="lazy"` (eager only for priority images) and `decoding="async"` (`client/src/shared/Photo.tsx`).
- **Step 4, deployment.** `Dockerfile` and `.dockerignore` build one production image: the client in HTTP mode, plus the compiled API serving it. CI job `image` builds it on every PR. Varad chose Railway on 2026-11-12; the runbook and the verified results are in `docs/deployment.md` ("Fill after verification").

## Commands actually run

macOS, Node 24.19.0, 2026-11-12 and 13.

| Command                                                            | Result | Relevant output                                                                                    |
| ------------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------- |
| `VITE_API_MODE=http npx vite build --config vite.config.ts` before | warn   | one 555.44 kB JS chunk (160.76 kB gzip), above Vite's 500 kB warning                               |
| same, after lazy routes                                            | pass   | no warning; largest chunks `index` 252.88 kB and `shared` 222.96 kB; page chunks 0.16 to 20.56 kB  |
| `npm run build`                                                    | pass   | no chunk-size warning                                                                              |
| image size scan (`find client/public -size +250k`)                 | pass   | 0 files over 250 kB of 61 images                                                                   |
| CI job `image` (`docker build .`), PR #27                          | pass   | built on `3edf69e` and `934ea77`                                                                   |
| `railway run --service MongoDB … seed.ts` (demo database only)     | pass   | "Seeded 15 fictional catalog fixtures (upsert; nothing deleted)." after the volume grew to 5 GB    |
| `curl` of the deployed health URL and deep links                   | pass   | health `ok`/`connected`; `/en`, `/es/catalog`, product and quote deep links 200; `/fr/catalog` 404 |
| `railway redeploy --service solcacao`, then health and products    | pass   | health still `connected`; `X-Total-Count` 14 after the restart                                     |

## Manual demo observations

On 2026-11-13, in the browser on the deployed site at desktop width, in English:

- the product page loads from the live API;
- a guest order: `POST /api/orders` 201, demo receipt with a database reference and $9.99, cart emptied;
- a six-piece sampler enquiry: `POST /api/inquiries` 201, "Your enquiry has been saved… The enquiry notification was sent." (SMTP to the Mailpit service over Railway's private network).

Spanish, phone width and the signed-in journeys were not repeated on the live site. They are covered by CI's live-API journeys and Phase 2 checks, and the other members repeat their own journeys on this deployment in their D22 turns.

## Public contract compatibility and peer dependencies

No contract change. Phase 4 step 4 for every other member uses this deployment.

## Known limitations or blocked checks

- Railway's trial plan caps volumes at 500 MB, and MongoDB 8 refuses writes with under 500 MiB free. The project is on Hobby with a 5 GB database volume.
- The quote upload surviving a redeploy was verified by Student 4 on this host in #29 (his phase-4-evidence.md).
- HTTP builds still ship the mock adapters: the catalog fixtures, the bundled dictionaries (about 223 kB, loaded with the first page) and the demo accounts. Building the adapters behind an inline constant did not remove them, because the mock modules have module-level side effects and `InquiryForm` imports the support mock directly. This is a follow-up.
- `React.lazy` keeps a failed page chunk failed until the page is reloaded.

## Closing turn (PR #33, 2026-11-14)

Run on the deployed `3e0c1f1` (all five member turns merged). Details and tables are in `docs/deployment.md` ("Closing-turn results").

### Implemented and changed paths

- **Layout shift (Phase 4 step 2).** `client/src/features/shell/Layout.tsx`: `<main>` is at least one screen tall (`min-h-svh`). Lighthouse on the deployed site found mobile CLS 0.4–0.7 on the catalog, product, wholesale, sampler and contact pages, all from the footer: it painted beside the short loading state of a page loaded on demand and moved when the page arrived.
- **Proxy hops.** `TRUST_PROXY=2` on Railway, measured (below); `docs/deployment.md` runbook step 4, `.env.example`, and Student 1's two READMEs (docs-only coordinator exception).
- **Rollback procedure** written out in runbook step 8 (Deployments, ⋮, Rollback, and back the same way).
- **Dependency audit.** `npm audit` went from 31 findings (4 critical, 16 high, 10 moderate, 1 low) to 2 moderate. Only patched releases published before 2026-10-31 (`--before`), within the current major versions: mongoose 9.11.4, multer 2.5.0, nodemailer 10.1.7, zod 4.6.7, vite 8.3.5, vitest 5.0.5 and concurrently 10.0.6, plus lockfile updates for body-parser 2.4.0, proxy-addr 2.0.8, qs 6.17.1, ip-address 10.7.5, undici 8.12.3 and source-map-js 1.2.2. The remaining two are react-router 6, fixed only in 7: the backslash open redirect is not reachable (`safeReturnTo` rejects backslashes and accepts only `/en` and `/es` paths), and the `deserializeErrors` issue needs server rendering, which the app does not use.
- **Records.** `docs/presentation.md` (25 minutes, from each member's segment draft), `docs/weekly/week-6.md`, `README.md` (live site, production build, Phase 3 and 4 submission table), `docs/deployment.md`.

### Commands actually run

| Command                                                                                                              | Result                                                                                     | Relevant output                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty `POST /api/auth/register` ×4, then with spoofed `X-Forwarded-For` and `X-Real-IP`, at `TRUST_PROXY=1` and `=2` | 1: two alternating buckets (r=9,9,8,8); 2: one bucket (r=9…3), spoofing does not escape it | one client IP (checked stable) and one replica (`numReplicas: 1`)                                                                                           |
| `railway variables` (names only), `railway logs`, Railway `tcpProxies`                                               | pass                                                                                       | all required names set; no email or token in the last 400 log lines; no TCP proxy on MongoDB                                                                |
| `npx playwright test --config .agent/pw-live-audit.config.mjs` (local, read only)                                    | pass                                                                                       | 68 page loads, EN/ES at 1440 and 375 px: no overflow, missing key, wrong `lang`, extra `h1` or failed request; only the intended not-found 404 message      |
| Lighthouse 13.6 (local Chrome) on 6 live pages, mobile and desktop                                                   | see docs/deployment.md                                                                     | accessibility 100, SEO 100, best practices 96 everywhere; mobile CLS up to 0.708                                                                            |
| Lighthouse on a local production build, before and after the `Layout.tsx` change                                     | pass                                                                                       | mobile CLS 0.397–0.663 → 0–0.087 (performance +17 to +23); desktop 0.151–0.439 → 0–0.115                                                                    |
| Chrome DevTools Protocol `Audits.issueAdded` on `/en`                                                                | one issue                                                                                  | `kEvalViolation` from zod's `Function('')` probe, blocked by the CSP as intended                                                                            |
| `npm audit` before and after                                                                                         | 31 → 2 moderate                                                                            | see above                                                                                                                                                   |
| Secrets scan of all 124 commits (`git log --all -p` against key, token, JWT, Mongo-URI and hex-secret patterns)      | pass                                                                                       | no `.env` ever committed; every match is a test fixture (an unsigned `alg: none` token, test-only secrets), a `replace-…` placeholder or a SHA-256 checksum |
| Production rollback rehearsal via the Railway API                                                                    | **not run**                                                                                | blocked by the agent's safety classifier; needs Varad in the dashboard (runbook step 8)                                                                     |
| PageSpeed Insights API                                                                                               | **not run**                                                                                | keyless daily quota exhausted; Lighthouse ran locally instead                                                                                               |

### Known limitations or blocked checks

- The rollback has not been rehearsed on Railway.
- Layout-shift numbers after the fix come from a local production build; re-measure on the host after the release deploys.
- The sampler keeps a small shift (0.115 desktop) from its product list loading: Student 5's proposal in handoff.md.
- The live journeys that sign in or read the inbox are Varad's to run on the deployed site.
- Presentation rehearsal not held yet.

## Review

Proposed commit: `varad-shell` (PR #33; turn 1 was PR #27 and #28)
Reviewer: Krishr21 (D22)
PR: https://github.com/tambevarad/solcacao/pull/33
Integrated commit: turn 1 `62e52e4` and `13a60a2`; closing turn pending
