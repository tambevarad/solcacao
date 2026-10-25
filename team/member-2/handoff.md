# Student 2 handoff

Current phase: 2 (Core Development). The shell foundation PR from `varad-shell` is ready for review. Peer integration steps follow after it merges.

## Public exports delivered

Signatures are in docs/contracts.md under "Shell public surface". Primitive usage is in client/src/shared/README.md.

- **`features/shell/public.tsx`:**
  - `useLocale()` returns `{ locale, setLocale, t(key, values?) }`.
  - `LocaleProvider` is mounted once in main.tsx.
  - `localizePath(locale, path)`, `SUPPORTED_LOCALES`, `isLocale`.
  - `usePageMeta({ title, description? })`.
- **`client/src/shared/index.ts`:** Button, buttonStyles, Field, TextArea, Select, Dialog, Drawer, LoadingState, EmptyState, ErrorState, Placeholder.
- **`api/notImplemented.ts`:** `NotImplementedError`, thrown by template stubs.
- **Routing:**
  - `client/src/routes.tsx` wraps every page in `PageFrame`: route title/description from `shell.meta.<id>.*`, with an error boundary that resets on page change.
  - Route paths and the prewired `RequireAuth`/`RequireRole` wrappers are unchanged.
- **Navigation:** one definition in `features/shell/navigation.ts`, shared by desktop nav, mobile drawer and footer. A test checks every target resolves to a route.
- **Backend:**
  - `GET /api/i18n/:locale`: 200 `{data}` for `en`/`es`, 400 `VALIDATION_ERROR` otherwise, from the same `dictionaries.ts` as the mock.
  - `createPublicAssetsRouter`, an unmounted template.

## Required peer exports and PRs

- **Student 3:**
  - Implement `CartProvider`, `useCart` and `CartDrawer` behind the existing `CartState` interface.
  - The header already reads `count` and `open` and calls `setOpen(true)`. While the stub throws `NotImplementedError`, it shows a labeled pending notice, which disappears automatically once `setOpen` works.
  - Optional: build `CartDrawer` with the shared `<Drawer side="right">` (docs/design.md asks for one shared right-hand drawer). Student 3 decides.
  - `CatalogPage` must read `search`, `category` and the other ProductQuery keys from the URL; the shell links to `?search=` and `?category=bar|truffle|seasonal`.
- **Student 1:**
  - Implement `useAuth`. The header picks `/login` or `/account` from `user`; the drawer's Sign out calls `logout()`.
  - Optional: export an auth modal built on `<Dialog>`; the shell can then open it from the account entry.
  - Decide how `returnTo` travels (a `?returnTo=` query parameter is suggested). The shell header links to `/:locale/login` without it until then.
- **Student 4:** `tests/e2e/scaffold.spec.ts` now checks the home route for the shell landmarks and exactly one `<h1>`, not the placeholder text, so the real HomePage will not break it. After it merges, Student 2 adds homepage-specific landmark and navigation checks (Phase 2 "Scaffold test transition").
- **All:** add your keys to your own `locales/en.json` and `locales/es.json`, replace your `<Placeholder>` in place, and request new routes or shared primitives from Student 2.

## Shared change proposals

1. **Student 1, `server/src/app.ts`; needed for Phase 3 compiled serving, not Phase 2.** Mount public assets before the JSON 404 handler:

   ```ts
   import path from 'node:path';
   import { createPublicAssetsRouter } from './features/shell/assets.js';
   app.use(
     '/placeholders',
     createPublicAssetsRouter({
       root: path.resolve('dist/client/placeholders'),
       privateDirs: [path.resolve(process.env.UPLOAD_DIR || 'server/storage')],
     }),
   );
   ```

   Impact: no contract change; `tests/health.test.ts` is unaffected. If Phase 3 production serving hosts all of `dist/client`, this mount is replaced by that configuration instead.

2. **Student 1 to Student 2, `.github/workflows/ci.yml`.** When Student 1 provides the Mongo service patch (`TEST_MONGODB_URI`), Student 2 adds it as a separate job. Typecheck, unit tests and build stay global. No change in this PR.

## Known limitations and next step

- Pages other than not-found are still the owners' placeholders. They are labeled as such in EN and ES.
- Not yet verifiable, waiting on peers:
  - real cart count and drawer (Student 3);
  - account and sign-out with a real user (Student 1);
  - EN/ES state retention on the real product page and wizard (Students 3 and 4). Proven so far with stand-in stateful pages.
- The asset router is not mounted (see proposal 1).
- `team/member-2/status.json` Phase 1 still says `not_started`, although PR #1 and PR #2 merged. The coordinator should record Phase 1 truthfully; the academic prototype is still pending per docs/phase1/prototype/README.md. Decision D21 lets Phase 2 proceed meanwhile; `npm run agent -- --member 2 --phase 2` now reports "Entry checks passed" plus a D21 note.
- Next, after merge:
  - integrate peer PRs in the docs/integration.md order;
  - run the whole-project build with peers merged;
  - replace the scaffold e2e assertion when HomePage lands;
  - finish the Phase 2 evidence with peer results.
