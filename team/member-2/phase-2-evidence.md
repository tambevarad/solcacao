# Student 2 Phase 2 evidence

State: ready_for_review (shell foundation PR from `varad-shell`). Peer-dependent acceptance items are listed under limitations; they are not claimed as passing.

## Implemented requirements and changed paths

- **SHELL-01, sticky header, footer and routing.**
  - Files: `features/shell/Layout.tsx`, `components/Header.tsx`, `components/Footer.tsx`, `PageFrame.tsx`, `pages/NotFoundPage.tsx`, `client/src/routes.tsx`, `client/src/main.tsx`, `client/index.html`.
  - Behavior: skip link; focus moves to main and scroll resets on page change; unknown paths and prefixes render not-found; per-route title/description; page error containment.
- **SHELL-02, mobile slide-out nav.**
  - Files: `components/MobileNav.tsx`, `client/src/shared/Drawer.tsx`, `client/src/shared/Modal.tsx`.
  - Behavior: focus trap and restore, Escape, scroll lock, inert background. Built from the same `navigation.ts` as desktop.
- **SHELL-03, global search and cart count.**
  - Files: `components/SearchForm.tsx`; the header reads `useCart()`.
  - Behavior: search goes to `/:locale/catalog?search=`. A labeled pending state shows while the cart stub is in place.
- **SHELL-04, EN/ES toggle and dictionaries.**
  - Files: `public.tsx` (`LocaleProvider`, `useLocale`, `t` with values), `locale.ts`, `dictionaries.ts`, `mock.ts`, `http.ts`, `locales/*.json` (83 keys each), `components/LanguageSwitcher.tsx`; server `features/shell/router.ts`; `tsconfig.server.json` (`resolveJsonModule`).
  - Behavior: `GET /api/i18n/:locale`; `<html lang>` follows the locale; missing keys are marked in development; loading and error recovery.
- **SHELL-05 and UX-01, shared components and design tokens.**
  - Files: `client/src/shared/{Button,Field,Dialog,Drawer,Modal,StatusStates,Placeholder,index}.tsx`, `client/src/shared/README.md`, `styles.css` (error token, reduced motion).
- **Backend asset template:** `server/src/features/shell/assets.ts`, documented in `server/src/features/shell/README.md`.
- **Docs and coordination:**
  - `docs/contracts.md` ("Shell public surface", key conventions), `docs/decisions.md` (D20), `docs/api.json` (i18n rules; contractVersion unchanged), `docs/integration.md` ("Phase 2 working guide").
  - `docs/design.md`, `docs/design/tokens.json`, `docs/deployment.md`, `TEAM-QUICKSTART.md`, `README.md`, `context.md`, `team/roster.json` (member 2).
- **Tests and config:**
  - `tests/member-2/*` (64 tests), `tests/e2e/shell.spec.ts` (7 tests).
  - `vitest.config.ts` now includes `tests/**/*.test.tsx`.
  - `api/notImplemented.ts` (`NotImplementedError`).

## Commands actually run

macOS, Node 24.19.0, npm 11.17.0, 2026-10-25.

| Command                                                                     | Result              | Relevant output or test count                                                                                                                                                                   |
| --------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                                                             | Pass                | Typecheck (client and server); 73 tests in 11 files (64 in tests/member-2, 9 in other files: 8 from the template plus 1 tooling test for D21); structure, translation parity and workflow valid |
| `npm run build` (after `rm -rf dist`)                                       | Pass                | Vite bundle 283.5 kB JS / 21.1 kB CSS; server compiled; 10 locale JSON files emitted under `dist/server/client/src/features/*/locales/`                                                         |
| Compiled API probe: supertest against `dist/server/server/src/app.js`       | Pass                | `/api/i18n/en` 200 (83 keys), `/es` 200 (83 keys), `/fr` and `/EN` 400 `VALIDATION_ERROR`                                                                                                       |
| `npm run check:ownership -- --member 2 --base development`                  | Pass                | All changed files within Student 2 ownership                                                                                                                                                    |
| `npx playwright test` (installed Google Chrome 155 via a local-only config) | Pass                | 8 tests: scaffold, overflow at 375/768/1440 across 7 EN/ES routes, keyboard drawer trap, language switch with reload and back, search URL, not-found. No React Router warnings                  |
| `tsc --noEmit` over `tests/member-2` (temporary config, not committed)      | Pass                | Test files type-check                                                                                                                                                                           |
| `prettier --check` on changed files                                         | Pass                | All formatted                                                                                                                                                                                   |
| `npm run agent -- --member 2 --phase 2`                                     | Entry checks passed | Branch matches roster (`varad-shell`); Phase 1 `not_started` shown as a D21 note, not a blocker                                                                                                 |

## CI follow-up on PR #3

The first GitHub Actions run failed one test, "links collections to canonical category query values". The header and Collections menu reset their open state in a mount-time effect, so a click that landed before passive effects flushed (slower CI runner) was overridden. Reproduced locally with a real-scheduler test: the old header fails, the fixed one passes. The reset now happens during render when the page changes. `tests/member-2/early-click.test.tsx` is the regression test. Title and `<html lang>` assertions now wait for their effects. Afterwards: 15 sequential full runs, plus 12 under parallel load, all passed; e2e 8/8.

## Review round 1 (Krish Ruparel, changes requested on 85dcc09)

All seven points were addressed:

1. D21 is now stated explicitly in the PR as part of what this approval covers.
2. Cart and catalog wording is now descriptive rather than an obligation.
3. The PR now says the schema edit removes the submission-evidence section; that guidance moved to docs/phase1/README.md.
4. Desktop Sign out was added, with tests.
5. Test counts are corrected: 64 in tests/member-2 plus 9 elsewhere.
6. The stale packet and roster notes are updated.
7. The language links' accessible names now start with the visible "EN"/"ES" (WCAG 2.5.3).

## Manual demo observations

Mock-mode dev server in the desktop app browser pane:

- **Desktop, 1440px:** header, nav row, Collections menu, footer, cart pending notice (EN and ES).
- **Mobile, 375px:** header fits with no overflow. The drawer shows search, nav with the current page highlighted, account links and the language switch.
- **Language:** EN to ES on `/en/catalog?category=truffle` keeps the query; nav, title and placeholder copy are translated.
- **Not-found:** `/fr/catalog` shows not-found with English/Español choices.
- **Console:** no errors or warnings.
- **Copy fix:** the Spanish search placeholder was shortened after it truncated in the 375px drawer.
- Screenshots were reviewed but not committed.

## Public contract compatibility and peer dependencies

- No DTO or HTTP contract change; contractVersion stays 2.
- `t` gains an optional second argument; existing calls are unaffected (D20).
- Route paths and the `RequireAuth`/`RequireRole` wrappers are unchanged.
- No dependency or lockfile changes.
- Peer dependencies are listed in `handoff.md` and docs/integration.md.

## Phase 2 integration results (2026-10-28)

All five members' Phase 2 PRs are merged into development after peer approval:

| PR                                                        | Owner    | Approved by | Merged as                           |
| --------------------------------------------------------- | -------- | ----------- | ----------------------------------- |
| #3 shell foundation (plus #6, #7, #8)                     | Member 2 | Krishr21    | 10fd054 (00381c0, 0bd8efa, 70bac90) |
| #5 homepage, wholesale, quote wizard and API              | Member 4 | tambevarad  | 6fc3f7b                             |
| #9 catalog, cart, simulated checkout and API              | Member 3 | tambevarad  | 3873f6f                             |
| #10 contact, feedback, sampler, Story/Care, inquiries API | Member 5 | tambevarad  | 88c9a0d                             |
| #11 auth UI, JWT middleware, DB bootstrap, account API    | Member 1 | tambevarad  | fc8ee86                             |

Coordinator integration work:

- **Stub-coupled tests:** when a member replaced a template stub, tests in other members' folders that asserted the stub broke CI. These were fixed in coordinator commits on the PR branch: 6c99fb4 in #9 and 72fef79 in #11. In #10, Member 5 applied a coordinator-approved one-line change.
- **PR #12, integration:**
  - Wired Member 1's `requireAuth`/`optionalAuth`/`requireRole('b2b')` and Member 5's `notifyQuote` into the catalog and B2B routers.
  - Startup builds every model's indexes.
  - CI runs a MongoDB service.
  - Added cross-feature journeys and run instructions.

Checks run on the integrated code (coordinator branch for PR #12, on top of fc8ee86):

- **Real MongoDB** (Docker `mongo:8.0`, `TEST_MONGODB_URI`): `npm run check` passed 518/518 with 0 skipped. This was the first run of members 1, 3, 4 and 5's persistence suites; all passed.
- **CI MongoDB:** PR #12's CI passed 518/518. After it merged (e088f4b, approved by danielyglesias), the push run failed before any test because a newer `mongo:8.0` image refuses to start on the runner's Linux 6.19+ kernel (SERVER-121912). The follow-up PR moves the CI service to `mongo:7.0`; `npm run check` passed 518/518 locally against 7.0.45.
- `npm run build`: pass. The >500 kB bundle advisory is a Phase 4 item.
- **Browser:** `npm run test:e2e` with installed Chrome: 14 passed.
  - Guest checkout to the confirmation page.
  - Guest cart kept on sign-in and cleared on sign-out.
  - The B2B journey: sign-in dialog, four steps with a PDF, switch to ES at step 3, receipt.
  - No horizontal overflow on every member's pages at 375/768/1440 in EN and ES.
- **Real API started against MongoDB:**
  - health 200 connected; products 200;
  - cart and quote routes 401 without a token;
  - feature indexes present (users.email, inquiries.requestId, orders.requestId, carts.userId);
  - without a JWT secret it refuses to start with a clear message.
- **Screenshots:** desktop (1440) and mobile (375) of every member's key pages, the cart drawer and the mobile menu are in `docs/phase2/screenshots/`. No console errors.

## Release and submission (2026-10-28)

- **Follow-ups:** #13 (CI on `mongo:7.0`), #14 and #15 (Member 5: sampler reset; catalog quantity picker under a coordinator-approved exception for Member 3's files), #17 (quantity clamp race), #19 (Member 1 Phase 1 record) and #21 (main → development sync). Each was approved by someone other than its author. The full table is in `docs/weekly/week-4.md`.
- **Releases to main:** #16 (d10153c) and #20 (1307a52), both approved by Krishr21 and merged with merge commits so every author keeps their commits. GitHub's contributors list now shows all five members.
- **Submission:** annotated tag `phase-2-submission` on 1307a52. CI on that commit passed 531/531 with every member's MongoDB persistence suite.
- **Re-check of the tagged commit against the docs/submissions.md Phase 2 checklist:**
  - Every route in EN/ES at 1440 and 375, plus the mobile menu, the cart drawer and the signed-in account and quote-wizard pages: 0 console errors or warnings, 0 failed requests, 0 missing translations, no placeholders, no overflow, one `h1` per page.
  - A fresh clone with `npm ci` and `npm run dev:client` served the site.
  - The catalog screenshots were retaken to show the quantity picker.
- **CI flakes found during the release:**
  - The #15 quantity race was fixed in #17.
  - `CartProvider`'s sign-in merge outliving `tests/member-1/pages.test.tsx` (`window is not defined`) is still open for Members 1 and 3. An unmount guard in `CartProvider` would break the StrictMode remount in development.

## Known limitations

- Phase 1 status is still unrecorded for Members 2–5 (D21). Member 1 recorded it in #19, with the prototype and demo still open.
- The public asset router is not mounted (Phase 3/4). Production serving of `dist/client` belongs to Phase 4 deployment.
- The bundle exceeds Vite's 500 kB advisory; code splitting is Phase 4.
- WhatsApp needs a real business number.
- Mock mode is the Phase 2 demo. Real HTTP binding of the UI is Phase 3.

## Review

PRs: #3, #6, #7 and #8 merged after Krishr21's approval. Integration PR #12 was approved by danielyglesias and merged as e088f4b. #13, #16, #17, #20 and #21 were approved by Krishr21.
Integrated commit for the five member PRs: fc8ee86 on development. Phase 2 submission commit: 1307a52 on main (tag `phase-2-submission`).
