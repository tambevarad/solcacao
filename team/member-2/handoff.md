# Student 2 handoff

Current turn: the closing D22 turn for Phases 3 and 4 (PR #33, after all five member turns merged). Earlier D22 work: PR #27 (merged as 62e52e4) and its follow-up #28 (13a60a2). Records: `docs/weekly/week-5.md` and `week-6.md`; evidence in `phase-3-evidence.md` and `phase-4-evidence.md`. After #33 merges: the release PR from `development` to `main`, then, on Varad's go-ahead, the `phase-3-submission` and `phase-4-final` tags, Railway switched to `main` and the submission zip.

## Public exports delivered

Signatures are in docs/contracts.md under "Shell public surface". Primitive usage is in client/src/shared/README.md.

- **`features/shell/public.tsx`:** `useLocale()` (`{ locale, setLocale, t(key, values?) }`), `LocaleProvider`, `localizePath(locale, path)`, `SUPPORTED_LOCALES`, `isLocale`, `usePageMeta({ title, description? })`.
- **`client/src/shared/index.ts`:** Button, buttonStyles, Field, TextArea, Select, Dialog, Drawer, LoadingState, EmptyState, ErrorState, Placeholder, `photos`, `productPhotos` and `<Photo>` (sources in `docs/assets.md`).
- **Routing:** `client/src/routes.tsx` loads every page except the homepage and not-found on demand, each inside `PageFrame` (title and description from `shell.meta.<id>.*`, an error boundary that resets on page change). `<main>` is at least one screen tall, so the footer never moves while a page loads.
- **Production serving:** `createClientRouter({ root, privateDirs })` and `APP_ROUTES` in `server/src/features/shell/client.ts`, mounted in `server/src/app.ts` when `CLIENT_DIST_DIR` is set. `APP_ROUTES` must match `client/src/routes.tsx`; `tests/member-2/client-serving.test.ts` fails if either side gains a route the other lacks.
- **Backend:** `GET /api/i18n/:locale` (200 for `en`/`es`, 400 otherwise).
- **Tests and CI:** `tests/e2e/live/journeys.live.spec.ts` (`npm run test:e2e:live`): catalog with its error state, guest order, cart merge, contact email, business quote with a PDF, and the six-piece sampler, each checked through the real `/api` response and, for mail, the Mailpit inbox (`MAILPIT_URL`, optional `MAILPIT_AUTH` for the deployed inbox). CI job `e2e-live` also runs Student 3's `tests/member-3` live journeys.
- **Deployment:** the root `Dockerfile` and the Railway runbook in `docs/deployment.md`.

## Shared change proposals

Earlier proposals: 1 (the `server/src/app.ts` client mount) landed in #27 as a coordinator ownership exception; Student 1 reviewed it in #32 and agreed. 2 (the CI MongoDB job) landed in Phase 2.

3. **Student 5, the sampler's product list (layout shift).** On `/en/sampler` the product list grows after the products load, which shifts the form below it: Lighthouse CLS 0.115 on desktop and 0.087 on mobile on a local production build, after #33's footer fix. Reserve the list's height while loading (for example a `min-h-[…]` on the list container, or six skeleton rows the size of a product row), then re-measure with Lighthouse. No contract change.
4. **Student 4, `client/src/features/b2b/components/FeaturedProducts.tsx:142` (Student 3's proposal 7, still open).** On `/es` the featured cards show the English origin. Use `t(\`catalog.origin.${product.origin.replace(/\s+/g, '')}\`)` as Student 3 proposed.
5. **Student 1, from my review of #32 (non-blocking).**
   - `server/src/app.ts:17`: `parseTrustProxy(process.env.TRUST_PROXY) || false` keeps express-rate-limit's warning when `TRUST_PROXY` is missing (it only warns when the setting is exactly `false`).
   - `server/src/shared/errors.ts:85`: `describeForLog` should also treat `error instanceof mongoose.Error` as a database error: Mongoose's `CastError` message quotes the value.
6. **Students 3 and 4, from Student 1's security sweep (team/member-1/handoff.md findings 3–6).** Full-error logging in `catalog/router.ts:165`, `b2b/router.ts:151` and `b2b/service.ts:116` should use `describeForLog`; `POST /api/orders` and `POST /api/b2b/quote` have no rate limit. Krish said on #32 that he takes findings 5 and 6.

Coordinator ownership exception in #33: `server/src/shared/README.md` and `server/src/features/auth/README.md` (Student 1) say `TRUST_PROXY` is 1 on Railway; #33 corrects both to the measured 2. Docs only.

Not taken in this release (optional, from Student 4's handoff): proposal 2 (a 768 px size for three homepage photos) and proposal 3 (a PDF download button on the quote receipt, contractVersion 3). Both are improvements, not fixes; the second changes a contract this late, so it waits for a later version.

## Known limitations and next step

- HTTP builds still ship the mock adapters (catalog fixtures, bundled dictionaries and the fictional mock-mode demo accounts). They are never used when `VITE_API_MODE=http`. A build-time constant alone does not remove them, because the mock modules have module-level side effects and `InquiryForm` imports the support mock directly (phase-4-evidence.md).
- Lighthouse best practices is 96: zod's one-time `eval` probe is blocked by the CSP, as intended (docs/deployment.md).
- npm audit: 2 moderate findings remain, both react-router 6 and fixed only in 7. Neither is reachable here (docs/weekly/week-6.md).
- The rollback in docs/deployment.md step 8 has not been rehearsed on Railway yet; it needs Varad in the dashboard.
- The live journeys that sign in or read the inbox were not run against the deployed site by the agent (they need the inbox password and register accounts); Varad runs them with the command in docs/deployment.md.
- `status.json` Phase 1 is still `not_started` for Students 2–5 (D21): the Phase 1 records must be filled in truthfully by each member.
- The presentation rehearsal (docs/presentation.md) has not been held.
