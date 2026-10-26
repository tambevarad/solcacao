# Integration order

Phase1: Student2 repository/Tailwind/routing shell; Student1 central schema/ERD; all owners model their entities and translation outlines; Student2 assembles all overview/prototype contributions. MS Teams demo requires the real external prototype URL, not just local frames.

Phase2 frontend track:2 shell/public components ->1 auth ->3 catalog/cart ->4 home/B2B and5 support/sampler. Backend track in the SAME phase:1 DB/auth/error ports ->2 dictionaries/static assets and3 catalog/cart ->5 inquiries/notification bridge ->4 B2B/files. Independent work may overlap against fixed stubs; final checks wait for named ports. No agent reimplements a peer’s dependency.

Phase3: switch real HTTP mode and run guest filter/cart/login-merge/logout/checkout; business wizard/upload/quote/notification; sampler/contact/feedback; ES/EN state retention; access-control failures; idempotent retries; SMTP outage after persistence; DB-trigger/service-logic audit. Record actual data/response/file/mail evidence. Never call a mocked success real integration.

Phase4: verify deployed deep links, real Mongo, durable private uploads, configured mail; compress assets, lazy-load, optimize measured queries; audit keyboard/mobile/ES–EN/console; finish clean-clone README and20–30minute demo.

Every week has one team integration record in docs/weekly. All primary-branch changes use reviewed PRs. Each PR requires visual review, passing unit tests, at least1 peer approval. Each owner supplies evidence; coordinator cannot mark untested peer work complete. HTTP failures must remain visible, not trigger mock fallback.

## Phase 2 working guide (coordinator)

### Step 1 is the shell foundation PR

The foundation PR is `varad-shell` into `development`, Student 2. It provides:

- **Routing shell.**
  - `/` redirects to `/en`.
  - Every page lives under `/:locale/...`.
  - Unknown paths and unsupported prefixes such as `/fr/...` render not-found inside the shell.
  - Each routed page is wrapped in `PageFrame`: localized default title/description and error containment.
- **Layout.**
  - Skip link, sticky header, and a desktop nav with a Collections menu.
  - Search to `/:locale/catalog?search=`.
  - Account entry from `useAuth().user`; cart count and open button from `useCart()`.
  - EN|ES switch that keeps path, query, hash, history state and mounted page state.
  - Mobile drawer (focus trap and restore, Escape, scroll lock) built from the same nav definition.
  - Footer.
- **Localization.**
  - `LocaleProvider` loads the combined dictionary through `api.shell`: the mock in Phase 2, `GET /api/i18n/:locale` in HTTP mode.
  - `t(key, values)` interpolation, `<html lang>`, `⟦key⟧` markers for missing keys in development, recovery when a load fails.
- **Shared primitives** in `client/src/shared/index.ts`: Button, Field, TextArea, Select, Dialog, Drawer, LoadingState, EmptyState, ErrorState, Placeholder.
- **Backend.** `GET /api/i18n/:locale`, verified from the compiled `dist/server`, plus an unmounted public-asset router template.
- **Docs.** Signatures in `docs/contracts.md` ("Shell public surface"); usage in `client/src/shared/README.md`.

### Who owns what

Everyone owns their own `locales/en.json` and `locales/es.json`, `team/member-N/` and `tests/member-N/`.

| Member | Owns (edit freely)                                                                                          | Publishes for others (signatures fixed)                                                                                                                       | Consumes                                                                                |
| ------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1      | `features/auth` (client and server), `server/src/shared`, `server/src/app.ts`, `index.ts`                   | `useAuth`, `AuthProvider`, `RequireAuth`, `RequireRole`, auth mock registry (`mock:<userId>` tokens), `requireAuth`/`optionalAuth`/`requireRole`, `connectDb` | `Dialog`/`Field`/`Button`, `useLocale`                                                  |
| 2      | `features/shell`, `client/src/shared`, `client/src/api`, routes, main, styles, configs, contracts, docs, CI | `useLocale`, `localizePath`, `usePageMeta`, `shared/index.ts`, `PageFrame`, `GET /api/i18n/:locale`                                                           | `useCart().count/open/setOpen`, `useAuth().user/logout`                                 |
| 3      | `features/catalog`, `contracts/fixtures.ts`, `client/public/placeholders`                                   | `useCart`, `CartProvider`, `CartDrawer` (shared `<Drawer side="right">` available), `api.catalog.*`, server `getActiveProductsByIds`                          | `useAuth` user changes (merge), `?search=` and `?category=` URL keys, shared primitives |
| 4      | `features/b2b`                                                                                              | HomePage, WholesalePage, QuoteWizardPage                                                                                                                      | `api.catalog.list`, `RequireRole`, auth mock identity, `notifyQuote`                    |
| 5      | `features/support`                                                                                          | Contact, Feedback, Sampler, Story and Care pages, `POST /api/inquiries`, `notifyQuote`                                                                        | `api.catalog.list/get`, `getActiveProductsByIds`                                        |

Replace your page's `<Placeholder>` in place. Keep the file path and default export so `routes.tsx` keeps resolving. Render content only, with one `<h1>`; Layout already provides `<main>`, the header and the footer.

### Images

- **Site photos:** use `photos` with `<Photo>` from `client/src/shared/index.ts`. Story-page options include `storyCacaoPods`, `storyBeansNibs`, `storyPodsStudio` and `homeStory`; `productDarkShards` and the product pool suit Care content.
- **Catalog fixtures (Reethika):** use `productPhotos`. Each entry is already `{ url, alt: { en, es } }`. The homepage featured products, the sampler and the cart drawer then show the same images through `api.catalog`.
- **Aman:** no auth page needs a photo. Reuse a library photo if a decorative image is wanted.
- **Adding images:** don't add images inside feature folders or hotlink them. Ask Student 2 to add one to the library, with its source and license in `docs/assets.md`.

### Shared files: agree before editing

`npm run check:ownership` flags edits to files you don't own. These need the owner's agreement first:

- **Student 2:** `client/src/routes.tsx`, `main.tsx`, `api/index.ts`, `api/http.ts`, `client/src/shared/*`, `styles.css`, `features/shell/*`, `contracts/index.ts`, `contracts/validation.ts`, `docs/api.json`, `docs/contracts.md`, `package.json`, `package-lock.json`, `vite`/`vitest`/`tsconfig`/`playwright` configs, `.github/`, `tests/e2e/`.
- **Student 1:** `server/src/app.ts`, `server/src/index.ts`, `server/src/shared/*`, `tests/health.test.ts`.
- **Student 3:** `contracts/fixtures.ts`, `client/public/placeholders/`.

To change one, write the exact change (old and new signature, consumers, tests) under "Shared change proposals" in your `handoff.md` and tell the owner. The owner lands it in a separate reviewed PR. Never add a dependency without explaining it in the PR, and never commit lockfile churn you did not intend.

### Setup and run (Node 24.19.0 from `.nvmrc`)

The fastest path is Prompt 2 in TEAM-QUICKSTART.md: your agent runs these commands for you. Manual equivalents:

```sh
npm run setup -- --member N              # clean tree required: syncs development, creates/switches your branch, .env, npm ci, hooks
npm run agent -- --member N --phase 2    # writes .agent/task.md for your coding agent
npm run dev:client                       # mock-mode frontend at http://localhost:5173 (no API or DB needed)
npm run dev                              # frontend + API (API on :4000; Vite proxies /api)
npm run services                         # Docker Mongo + Mailpit for backend persistence tests
```

Your task packet will note that your Phase 1 status is not recorded. Decision D21 in docs/decisions.md authorizes Phase 2 anyway: proceed, mention it in your evidence, and record your Phase 1 status truthfully. Setup uses the dedicated branch recorded for you in `team/roster.json` (for example `krish-b2b`). To rename it, ask the coordinator in a reviewed PR.

### Before the shell PR merges

You can start immediately on:

- your mock adapter, state, reducers and providers;
- server routers, models, validation and tests;
- page logic built with native elements;
- your locale keys.

On `development`, `useLocale().t('your.key')` already exists. It shows raw keys until the shell merges.

Wait for the merge before using:

- imports from `client/src/shared/index.ts`;
- `t(key, values)`;
- `localizePath`;
- `usePageMeta`.

Do not copy shell code, create local primitives, or base your branch on `varad-shell` (your PR would carry its commits). To preview the combination locally, use a throwaway branch you never push:

```sh
git switch -c preview-shell origin/development
git merge origin/varad-shell
```

### After the shell PR merges

On your own branch, with a clean tree:

```sh
git fetch origin
git merge origin/development
```

Use merge, not rebase, and never force-push. `npm run setup -- --member N` also works: it fast-forwards when it can and stops with instructions if your branch has diverged.

### Required before opening a PR

```sh
npm run check
npm run build
npm run check:ownership -- --member N --base development
npm run test:e2e        # after: npx playwright install chromium
```

Also:

- check 375, 768 and 1440 widths, EN/ES and keyboard use by hand;
- update `phase-2-evidence.md`, `handoff.md` and `status.json`;
- use the PR template;
- get one peer approval.

Tests that use supertest bind a local port; that works on normal machines and in CI.

### Dependencies that cannot be removed

Develop against the stubs. Integration checks wait for the named PR.

- **Student 3 on Student 1:** login cart merge needs `useAuth`. The guest cart works with the current stub (`user` is null).
- **Student 4 on Student 3:** the homepage needs `api.catalog.list`. The stub throws `NotImplementedError`; show a loading, error or pending state, never a private product list.
- **Student 4 on Student 1:** the wizard route needs `RequireRole`, which fails closed for now. Test the wizard component directly.
- **Student 5 on Student 3:** the sampler needs `api.catalog.list/get`. Feed products through test doubles in your tests only.
- **Backend:**
  - Students 3, 4 and 5 need Student 1's auth middleware.
  - Student 5 needs Student 3's `getActiveProductsByIds`.
  - Student 4 needs Student 5's `notifyQuote`.
  - Inject these as parameters in unit tests until the real ports merge.
- **Student 2 on others:** cart count and drawer (3), account and sign-out (1) and the real homepage e2e assertion (4) are verified once those PRs merge.
