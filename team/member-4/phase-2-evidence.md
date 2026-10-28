# Student 4 Phase 2 evidence

State: ready_for_review (branch `krish-b2b`, created from `development` at `10fd054`). Owned checks pass.
`npm run check` still fails on 4 Student 2 tests that assert the HomePage placeholder; the fix is
proposed in `handoff.md` and listed under limitations. Decision D21 authorized Phase 2 while this
member's Phase 1 status is `not_started`; that entry is left as recorded, not backfilled.

## Implemented requirements and changed paths

- **HOME-01, homepage** (`client/src/features/b2b/pages/HomePage.tsx`, `components/HeroCarousel.tsx`,
  `components/FeaturedProducts.tsx`, `components/ImageSlot.tsx`):
  - Hero slides following the WAI-ARIA carousel pattern: pause/play first in tab order, previous, next
    and slide choice. No autoplay with reduced motion; pauses on hover or focus; manual navigation
    stops rotation; only the active slide is exposed.
  - Featured products only through `api.catalog.list`. Loading, empty, error-with-retry and "catalog
    not connected yet" states are distinct.
  - Collection links use canonical `?category=bar|truffle|seasonal`. Corporate gifting, story and
    sampler entries. One `h1`.
- **B2B-01, wholesale page** (`pages/WholesalePage.tsx`): custom molds, personalized packaging and
  white-label sections; packaging examples; how-it-works and requirements; exactly one "Start your
  custom quote" action. Guests and retail accounts get guidance (not a guard).
- **B2B-02, four-step wizard** (`wizard.ts`, `pages/QuoteWizardPage.tsx`, `components/QuoteSteps.tsx`,
  `components/WizardStepper.tsx`, `components/ChoiceCards.tsx`):
  - One reducer holds the `QuoteInput` draft and the in-memory `File`. Validation gates only the
    current step; review validates everything again; stepper jumps still gate intermediate steps.
  - Horizontal stepper on desktop, compact current-step text on phones; completed steps editable.
  - Focusable error summary with links to each control; inline errors with `aria-invalid`.
  - Prefills company and email from `useAuth().user` without overwriting typed values.
- **B2B-03, PDF upload**: client pre-checks type, extension, empty file, 5 MiB and the `%PDF-`
  signature (assistance only). A rejected replacement keeps the accepted file. Replace and remove
  supported. Sanitized display name in the summary. The file is never written to browser storage.
- **B2B-04, submission** (`mock.ts`, `http.ts`):
  - Mock: same validation and errors as the server, enforces the b2b role, deterministic receipt per
    `requestId`, identical retry returns the original receipt, different body returns 409, never
    claims an email was sent. Demo scenarios via `VITE_B2B_MOCK_SCENARIO=fail-first|notification-failed`.
  - HTTP adapter: `FormData` with `metadata` (JSON string) and `designFile`; no manual Content-Type.
  - Wizard: pending state blocks duplicate submits; failures keep draft and file; a retry resends
    the identical payload with the same `requestId`; any edit starts a new `requestId`; draft clears
    only after a receipt. Truthful receipt (demo vs saved; notification sent / not sent / failed).
- **B2B-04/05, backend** (`server/src/features/b2b/*`):
  - `POST /api/b2b/quote`: auth and role checks before multer; memory upload; exactly one `metadata`
    field and one `designFile`; strict `quoteSchema`; declared MIME, extension, signature and 5 MiB
    checks (400/413/415); 503 when the database is not connected.
  - `b2bRequests` model with unique `(userId, requestId)`, request hash (canonical metadata + file
    SHA-256) and private file metadata. Private storage `<UPLOAD_DIR>/b2b/<uuid>.pdf`, never served
    statically; files removed on any failure after writing, on duplicates and on conflicts.
  - Saved before `notifyQuote`; `failed` or a thrown error is recorded and reported, request kept.
  - Concurrent identical submissions produce one request, one file and one notification attempt.
  - `GET /api/b2b/quotes/:id` and `/file`: owner-scoped (another business gets 404), malformed id 400,
    attachment with sanitized filename, `nosniff`, `private, no-store`.
  - Peer ports are injected through `createB2bRouter`; the mounted `b2bRouter` fails closed (401).
- **Translations**: 183 `b2b.*` keys in EN and ES with matching `{tokens}`; no hard-coded shopper text.
- **Tests** (`tests/member-4`, 82 tests in 9 files): wizard state machine, adapters, wizard UI
  journeys, homepage and wholesale pages, route guard wiring, fail-closed default, dictionaries, API
  validation/authorization without a database, and persistence against real MongoDB.

## Commands actually run

macOS, Node 24.19.0 (fnm, `.nvmrc`), npm 11.17.0, 2026-10-25. Docker MongoDB 8.0 and Mailpit via
`npm run services`.

| Command                                                            | Result              | Relevant output or test count                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run setup -- --member 4`                                      | Pass                | Created `krish-b2b` from `development` (`10fd054`), wrote `.env`, ran `npm ci` (npm reported 15 existing audit findings and skipped install scripts for bcrypt, esbuild, fsevents; lockfile not touched)                                                           |
| `npm run services`                                                 | Pass                | `mongo` and `mailpit` containers running                                                                                                                                                                                                                           |
| `npx playwright install chromium`                                  | Pass                | Chromium 1243 installed                                                                                                                                                                                                                                            |
| `npm run agent -- --member 4 --phase 2`                            | Entry checks passed | Branch matches roster; Phase 1 `not_started` shown as a D21 note                                                                                                                                                                                                   |
| `npm run check`                                                    | **Fail**            | Typecheck pass. Vitest: 4 failed, 141 passed, 10 skipped (persistence tests without `TEST_MONGODB_URI`). All 4 failures are in `tests/member-2` (placeholder assertions). `check:structure` and `check:workflow` did not run because of `&&`; run separately below |
| `TEST_MONGODB_URI=… npm run check`                                 | **Fail**            | Same 4 `tests/member-2` failures; 151 passed                                                                                                                                                                                                                       |
| `npm run typecheck`, `check:structure`, `check:workflow`           | Pass                | "Structure, phase metadata, endpoint inventory and translation parity valid." / "Dedicated branch roster and CI baseline valid."                                                                                                                                   |
| `npx vitest run tests/member-4`                                    | Pass                | 72 passed, 10 skipped without Mongo; 82 passed with `TEST_MONGODB_URI` (Docker Mongo). Run repeatedly with no failures                                                                                                                                             |
| `npm run build` (clean `dist`)                                     | Pass                | 2036 modules; JS 430.70 kB, CSS 26.59 kB; `dist/server/server/src/features/b2b/*.js` emitted; no warnings                                                                                                                                                          |
| `npm run check:ownership -- --member 4 --base development`         | Pass                | "All 39 changed files are within Student 4 ownership."                                                                                                                                                                                                             |
| `npm run test:e2e`                                                 | Pass                | 8 passed, including no horizontal overflow at 375/768/1440 on `/en` and `/es`                                                                                                                                                                                      |
| Proposed `tests/member-2` patch, applied temporarily then reverted | Pass                | Full suite: 145 passed, 10 skipped                                                                                                                                                                                                                                 |
| `prettier --check` on owned paths                                  | Pass                |                                                                                                                                                                                                                                                                    |
| `tsc` over `tests/member-4` (temporary config outside the repo)    | Pass                |                                                                                                                                                                                                                                                                    |

Defects found during verification and fixed in this branch:

- The homepage overflowed by 35px at 375px (hero grid's implicit `auto` column). Fixed with
  `grid-cols-1`; confirmed by `npm run test:e2e`.
- multer 2 rejects a request at its `parts` limit, so valid uploads failed. Removed `parts`;
  `files: 1` and `fields: 1` enforce the shape.
- A malformed multipart body from a signed-in business returned 500. Parse errors now return 400.
- A dynamic import in the mock caused a Vite build warning; the mock now calls the auth mock directly.

## Manual demo observations

Mock-mode dev server, reviewed in the desktop app's browser pane:

- **Homepage, 1440px EN and 375px ES:** labeled image slots, Student 3's labeled fixture art on the
  collection tiles, featured area labeled as waiting for the catalog. At 375px: no overflow,
  `lang="es"`, one `h1`, title "Chocolate artesanal · SolCacao".
- **Keyboard:** tab order skip link → header → carousel pause; 3px focus ring visible; pause and next
  slide work from the keyboard and stop rotation.
- **Wholesale, 768px ES:** no overflow, one start action linking to `/es/wholesale/request`, long
  Spanish headings wrap.
- **Wizard:** the real route stays closed (RequireRole stub), so it was reviewed through a temporary,
  uncommitted preview page rendering the real `QuoteWizardPage` inside the real shell `Layout`, with
  an injected mock business identity and the `fail-first` scenario. The preview was deleted afterwards.
  - 1440px: empty Continue showed and focused the error summary; a synthetic in-page PDF showed the
    file card and "Replace" label; switching to ES at step 3 kept the step, company, email, gift box
    and file; the review listed everything in Spanish.
  - The first send failed as configured: answers and file kept, button "Intentar enviar de nuevo";
    the retry succeeded with the demo receipt ("not saved on a server, no email sent").
  - 768px: horizontal stepper; a PNG produced only the inline "must be a PDF" error.
  - 375px: compact "Step 2 of 4 · Branding file" text; step 1 completed with keyboard only (arrow keys
    on radios, Tab, Enter); no overflow.
- **Console:** no errors or warnings on `/en` and `/es/wholesale` in a fresh tab. The preview page
  alone logged React Router future-flag warnings because its `MemoryRouter` did not set the flags
  `main.tsx` sets.
- Screenshots were reviewed but not committed.

## Public contract compatibility and peer dependencies

- No DTO, route or `docs/api.json` change; `contractVersion` unchanged. An identical replay returns
  `201` with the original receipt, matching the documented success status.
- `server/src/features/b2b/types.ts` repeats the documented `req.user?: User` augmentation so the
  routes compile before Student 1's port lands; identical declarations merge, and it can then be deleted.
- Uses only published ports: `useLocale().t(key, values)`, `localizePath`, `usePageMeta`, shared
  primitives, `useAuth`, `RequireRole` (via routes), `api.catalog.list`, `api.b2b`.
- No dependency or lockfile changes. Peer requests are in `handoff.md`.

## Known limitations or blocked checks

- **`npm run check` fails** until Student 2 updates 4 tests in `tests/member-2` that assert the
  HomePage placeholder and a single `role="status"` (exact patch in `handoff.md`). This PR should
  merge with or after that change.
- **Wizard access** in the app is closed by the RequireRole template stub; guest/retail/b2b UX belongs
  to Student 1 and is only tested with a test double.
- **Mock submission** in the running app depends on Student 1's auth mock (`me()` still throws
  `NotImplementedError`); the wizard shows "can't be sent yet" in that case.
- **Backend** fails closed (401) until Student 1's `requireAuth`/`requireRole` and `connectDb`;
  notifications report `failed` until Student 5's `notifyQuote`. No real end-to-end HTTP journey yet.
- **Featured products** show the labeled pending state until Student 3's `api.catalog.list`.
- **Persistence tests** need `TEST_MONGODB_URI`; CI has no Mongo service yet, so they are skipped there.
- **No B2B browser journey** in `tests/e2e` (Student 2's folder); proposed in `handoff.md`.
- The draft lives in memory only: a reload starts over and requires choosing the file again. No
  company, email or file data is written to browser storage.
- Real photography and copy are not supplied; image slots are labeled. No prices, lead times,
  certifications or contact details are claimed.
- `context.md` says Phase 2 uses no MongoDB, while `team/member-4/phase-2.md`, `docs/roadmap.md` and
  `docs/integration.md` place the backend track in Phase 2. This work follows the phase file.

## Review

Proposed commits: see the PR commits on `krish-b2b`.
Reviewer: pending (coordinator, member 2).
PR: opened from `krish-b2b` into `development`.
Integrated commit: pending merge.
