# Student 2 Phase 4 evidence

State: in progress on `varad-shell` (first D22 turn, shared PR with Phase 3). Not deployed yet.

## Implemented requirements and changed paths

- **Step 2, bundle.** `client/src/routes.tsx` loads every page except the homepage and not-found on first visit (`React.lazy`), behind a `Suspense` loading state inside `PageFrame`, so a failed page chunk shows the page error state.
- **Step 2, images.** The shared photo library was measured and needed no change: 61 images, none over 250 kB (2.6 MB in total across all sizes), each served with `srcset`, `width`/`height`, `loading="lazy"` (eager only for priority images) and `decoding="async"` (`client/src/shared/Photo.tsx`).
- **Step 4, deployment preparation.** `Dockerfile` and `.dockerignore` build one production image: the client in HTTP mode, plus the compiled API serving it. CI job `image` builds it on every PR. Varad chose Railway on 2026-11-12; the runbook is in `docs/deployment.md`. The deployment itself waits for Varad's Railway account.

## Commands actually run

macOS, Node 24.19.0, 2026-11-12.

| Command                                                            | Result | Relevant output                                                                                   |
| ------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------- |
| `VITE_API_MODE=http npx vite build --config vite.config.ts` before | warn   | one 555.44 kB JS chunk (160.76 kB gzip), above Vite's 500 kB warning                              |
| same, after lazy routes                                            | pass   | no warning; largest chunks `index` 252.88 kB and `shared` 222.96 kB; page chunks 0.16 to 20.56 kB |
| `npm run build`                                                    | pass   | no chunk-size warning                                                                             |
| image size scan (`find client/public -size +250k`)                 | pass   | 0 files over 250 kB of 61 images                                                                  |

## Manual demo observations

See phase-3-evidence.md (compiled app without a database). The deployed site has not been checked yet.

## Public contract compatibility and peer dependencies

No contract change. Phase 4 step 4 for every other member uses this deployment.

## Known limitations or blocked checks

- Not deployed: waiting for Varad's Railway account (runbook in docs/deployment.md).
- HTTP builds still ship the mock adapters: the catalog fixtures, the bundled dictionaries (about 223 kB, loaded with the first page) and the demo accounts. Building the adapters behind an inline constant did not remove them, because the mock modules have module-level side effects and `InquiryForm` imports the support mock directly. This is a follow-up.
- `React.lazy` keeps a failed page chunk failed until the page is reloaded.

## Review

Proposed commit: in progress on `varad-shell`
Reviewer: Krishr21 (D22)
PR:
Integrated commit:
