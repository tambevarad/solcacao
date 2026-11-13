# Student 2 Phase 4 evidence

State: ready for review on `varad-shell`, PR #27 (first D22 turn, shared PR with Phase 3). Deployed on Railway: https://solcacao-production.up.railway.app

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
- The quote upload surviving a redeploy on the host's disk is Student 4's check in his D22 turn (it needs a business sign-in).
- HTTP builds still ship the mock adapters: the catalog fixtures, the bundled dictionaries (about 223 kB, loaded with the first page) and the demo accounts. Building the adapters behind an inline constant did not remove them, because the mock modules have module-level side effects and `InquiryForm` imports the support mock directly. This is a follow-up.
- `React.lazy` keeps a failed page chunk failed until the page is reloaded.

## Review

Proposed commit: `varad-shell` (PR #27)
Reviewer: Krishr21 (D22)
PR: https://github.com/tambevarad/solcacao/pull/27
Integrated commit:
