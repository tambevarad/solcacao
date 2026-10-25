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
  - `tests/member-2/*` (52 tests), `tests/e2e/shell.spec.ts` (7 tests).
  - `vitest.config.ts` now includes `tests/**/*.test.tsx`.
  - `api/notImplemented.ts` (`NotImplementedError`).

## Commands actually run

macOS, Node 24.19.0, npm 11.17.0, 2026-10-25.

| Command                                                                     | Result             | Relevant output or test count                                                                                                                                                  |
| --------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run check`                                                             | Pass               | Typecheck (client and server); 70 tests in 10 files (18 existing, 52 member-2); structure, translation parity and workflow valid                                               |
| `npm run build` (after `rm -rf dist`)                                       | Pass               | Vite bundle 283.5 kB JS / 21.1 kB CSS; server compiled; 10 locale JSON files emitted under `dist/server/client/src/features/*/locales/`                                        |
| Compiled API probe: supertest against `dist/server/server/src/app.js`       | Pass               | `/api/i18n/en` 200 (83 keys), `/es` 200 (83 keys), `/fr` and `/EN` 400 `VALIDATION_ERROR`                                                                                      |
| `npm run check:ownership -- --member 2 --base development`                  | Pass               | All changed files within Student 2 ownership                                                                                                                                   |
| `npx playwright test` (installed Google Chrome 155 via a local-only config) | Pass               | 8 tests: scaffold, overflow at 375/768/1440 across 7 EN/ES routes, keyboard drawer trap, language switch with reload and back, search URL, not-found. No React Router warnings |
| `tsc --noEmit` over `tests/member-2` (temporary config, not committed)      | Pass               | Test files type-check                                                                                                                                                          |
| `prettier --check` on changed files                                         | Pass               | All formatted                                                                                                                                                                  |
| `npm run agent -- --member 2 --phase 2`                                     | Blocked (expected) | Branch matches roster; reports Phase 1 status `not_started`                                                                                                                    |

## CI follow-up on PR #3

The first GitHub Actions run failed one test, "links collections to canonical category query values". The header and Collections menu reset their open state in a mount-time effect, so a click that landed before passive effects flushed (slower CI runner) was overridden. Reproduced locally with a real-scheduler test: the old header fails, the fixed one passes. The reset now happens during render when the page changes. `tests/member-2/early-click.test.tsx` is the regression test. Title and `<html lang>` assertions now wait for their effects. Afterwards: 15 sequential full runs, plus 12 under parallel load, all passed; e2e 8/8.

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

## Known limitations or blocked checks

- **Pending peer PRs:**
  - the real cart count and drawer path (verified only against the `CartState` interface with a test double);
  - real auth user/logout;
  - EN/ES state on the real product and wizard pages (verified with stand-in stateful pages);
  - the whole-project build with peer branches.
- **Asset router not mounted:** waiting on Student 1's `app.ts` (proposal in `handoff.md`). Private-path rejection is verified by tests.
- **Mongo CI job:** waiting on Student 1's patch.
- **Browser runner:** Playwright's bundled Chromium (revision 1243) is not installed on this machine, so e2e ran with installed Chrome. CI does not run e2e yet (Phase 3).
- **Sandbox:** supertest-based tests need local port binding; they were run with it allowed.

## Review

Proposed commit: see the PR commits on `varad-shell`.
Reviewer: pending (one peer approval required).
PR: opened from `varad-shell` into `development`.
Integrated commit: pending merge.
