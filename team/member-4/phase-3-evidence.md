# Student 4 Phase 3 evidence

State: ready for review on `krish-b2b` (D22 turn 2; Phases 3 and 4 share one PR). Everything below
ran against a real MongoDB, real uploads and Mailpit. Mocked runs are listed separately and are not
counted as integration evidence.

## Implemented requirements and changed paths

- **Step 1, the full quote journey in HTTP mode.**
  - No binding code was needed: `createHttpB2B` already posts the multipart request through the
    shared transport.
  - Verified end to end with a real business sign-in, the compiled API, MongoDB and Mailpit.
    - The request carries `Authorization: Bearer …`.
    - The stored record and file match the review screen; the PDF is downloaded back and compared
      byte for byte.
    - The receipt states the real notification result.
- **Step 2, notification outcomes and session expiry.**
  - With Mailpit stopped, the receipt and the record say `failed`, the quote stays retrievable by
    its owner, and the UI says it need not be sent again.
  - **The gap found:** when the one-hour session ends, Student 1's `RequireRole` replaces the
    wizard with a sign-in prompt, which unmounted the page and lost the draft and file.
  - **The fix** (`client/src/features/b2b/draftStore.ts`, `pages/QuoteWizardPage.tsx`,
    `wizard.ts`): the wizard state now lives in a per-tab, memory-only store keyed by the account.
    - Signing in again with the same account returns to the same step, answers and PDF, with a
      "Start over" option. Another account starts empty, and a reload clears it.
    - A 401 on submit keeps the draft and calls `logout()`, so the guard asks for sign-in instead of
      retrying blindly.
    - A response that arrives after the page unmounted is applied to the kept draft (the receipt
      shows on return). One for a discarded draft is ignored.
  - New strings: `b2b.wizard.restored` and `b2b.wizard.startOver`, in EN and ES. The Spanish
    receipt's date label is now "Fecha de envío", so it no longer reads "Enviada" like the email
    status.
- **Step 3, back/edit/language/phone/keyboard with real delays and upload failures.** These were
  exercised in the live journeys:
  - a 1.5 s upload delay with the busy state;
  - a server rejection of the file, which returns to step 2 with the reason;
  - a lost response, which keeps everything and retries with the same `requestId`, so the server
    returns the original receipt: one record and one email;
  - a switch to Spanish at step 3;
  - all four steps at 375 px by keyboard only, including opening the file chooser.
- **Step 4, private uploads.**
  - Survive a real process restart, with identical bytes.
  - Unreachable by any static or guessed path in the production app.
  - Download only through the owner-checked route with
    `Content-Disposition: attachment; filename="…"`, `nosniff` and `private, no-store`. No public
    URLs were introduced.
  - New tests: `tests/member-4/private-storage.test.ts` and a restart case in
    `quote-persistence.test.ts`.
- **Step 5, homepage.**
  - Featured products come from `GET /api/products`: four seeded products. Against an empty catalog
    the API returns `[]` and the empty state shows.
  - Alt text comes from the shared library in both languages, and decorative images are marked
    decorative.
  - Image loading was reworked in Phase 4 step 2 (phase-4-evidence.md).
- **Step 6:** the presentation segment is drafted in phase-4-evidence.md.
- **Audits:**
  - **Triggers:** none are specified (`docs/data-model.md`) and none were added. The equivalent
    service logic is the unique `(userId, requestId)` index, file-then-record with cleanup, and
    notify-after-save.
  - **Security sweep** of `client|server/src/features/b2b`:
    - no `innerHTML`, `eval`, browser storage, direct `fetch` or console logging;
    - no secrets;
    - auth runs before multer reads any file;
    - storage names are generated, with folder mode 0700 and file mode 0600;
    - no disk paths in responses.
  - **EN/ES:** 172 keys in each file, the same set and the same placeholders. All 121 static keys
    and all 54 dynamic keys used in code exist.

Changed paths:

- `client/src/features/b2b/`: `draftStore.ts` (new), `pages/QuoteWizardPage.tsx`, `wizard.ts`,
  `locales/en.json`, `locales/es.json`, `README.md` (new). Phase 4 image work is listed in
  phase-4-evidence.md.
- `server/src/features/b2b/README.md`.
- `tests/member-4/`:
  - `wizard.test.tsx`, `quote-persistence.test.ts` and `quote-test-app.ts` (changed);
  - `private-storage.test.ts`, `images.test.tsx`, `playwright.config.ts` and
    `quote-journey.live.spec.ts` (new).

## Commands actually run

macOS, Node 24.19.0, Docker 29.2.1, 2026-11-12/13 (local time).

- **Services:** `npm run services` started `mongo:8.0` and `axllent/mailpit:v1.27`.
- **Live journeys:** the compiled API ran as in CI's `e2e-live` job:
  - the client built with `VITE_API_MODE=http`;
  - `npm run seed:catalog` into `solcacao_e2e`;
  - `CLIENT_DIST_DIR=dist/client`;
  - SMTP to Mailpit.

| Command                                                                                                            | Result           | Relevant output or test count                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Setup check on `development` 13a60a2 (`TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test_ci npm run check`) | pass             | 550/550, none skipped; Node 24.19.0, `gh` signed in as Krishr21                                                                                                                                |
| `git merge origin/development`                                                                                     | pass             | fast-forward from 74e03f3 to 13a60a2 (no rebase)                                                                                                                                               |
| `TEST_MONGODB_URI=… npm run check` (final code, run twice)                                                         | pass             | 46 files, 564/564 both times, none skipped; structure, translation parity and workflow valid                                                                                                   |
| same, earlier runs during this turn                                                                                | fail, then fixed | my new tests timed out under full-suite load (1 s Testing Library wait; effects not yet run before advancing a fake clock). Fixed in the tests (5 s waits, effects flushed); no product change |
| `npm run build`                                                                                                    | pass             | no chunk-size warning; largest chunk `index` 254.65 kB                                                                                                                                         |
| `npm run check:ownership -- --member 4 --base origin/development`                                                  | pass             | all changed files within Student 4 ownership                                                                                                                                                   |
| `npm run test:e2e` (Student 2's mock-mode suite)                                                                   | pass             | 15 passed (mock adapters; not integration evidence)                                                                                                                                            |
| `npm run test:e2e:live` (Student 2's live suite)                                                                   | pass             | 4 passed, 2 placeholders skipped                                                                                                                                                               |
| `npx playwright test --config tests/member-4/playwright.config.ts`                                                 | pass             | 5 passed: full journey with file and email checks, upload rejection plus lost-response retry, refused session, one-hour expiry, 375 px keyboard-only in ES                                     |
| same with `docker compose stop mailpit` and `EXPECT_NOTIFICATION=failed`                                           | pass             | 4 passed, 1 skipped (it counts emails): receipt and record say `failed`, quote and file still retrievable                                                                                      |
| Proposal 1 (handoff) applied to a copy of `tests/e2e/live/journeys.live.spec.ts`                                   | pass             | 5 passed, 1 placeholder skipped                                                                                                                                                                |
| Real restart: upload with `curl`, stop and start `npm start`, download                                             | pass             | 201 before; after the restart 200, `application/pdf`, `attachment; filename="restart-brand.pdf"`, `nosniff`, `private, no-store`; SHA-256 identical; no token gives 401                        |
| Static paths to the stored file on the running server                                                              | pass             | 9 paths (`/<key>`, `/b2b/…`, `/uploads/…`, `/storage/…`, `/server/storage/…`, `/data/uploads/…`, `/assets/…`, encoded `..` traversal) all 404 JSON                                             |
| Invalid uploads on the running server                                                                              | pass             | no `%PDF-` signature gives 415 `UNSUPPORTED_FILE`; over 5 MiB gives 413 `FILE_TOO_LARGE`; a retail account gives 403; rejected uploads left no files                                           |
| MongoDB `solcacao_e2e.b2bRequests` after all runs                                                                  | as expected      | 12 records, 12 distinct `requestId`s, 12 files on disk; `notificationStatus` 8 `sent`, 4 `failed` (the Mailpit-stopped run)                                                                    |
| Empty catalog: API on a database with no products, homepage in a browser                                           | pass             | `GET /api/products` 200, `[]`, `X-Total-Count: 0`; "No featured chocolates right now." with a link to the catalog                                                                              |

## Manual demo observations

- **Visual review on the live API**, with screenshots captured headlessly and inspected:
  - the homepage, wholesale page, all four wizard steps and the receipt;
  - at 375, 768 and 1440 px, in EN and ES: 42 views;
  - no horizontal overflow and no console errors in any of them.
- **Phone and keyboard:** the 375 px keyboard-only journey in Spanish completes and moves focus to
  each step heading and to the receipt heading.
- **Error paths:**
  - a file the server refuses returns to step 2 with "The file must be a PDF.";
  - a lost response shows "We couldn't send your request…" with "Your answers and file are still
    here.", and "Try sending again" gets the original reference;
  - a refused session shows "Sign in to continue", and after sign-in the review returns with the
    file.

## Public contract compatibility and peer dependencies

- No contract, route or `docs/api.json` change; contractVersion stays 2.
- Peer ports used as published:
  - Student 1: `RequireRole`, `useAuth().user` and `logout()`, `requireAuth` and `requireRole`;
  - Student 3: `api.catalog.list`;
  - Student 5: `notifyQuote`.
- No failure was found in Student 1's sign-in or Student 5's notification code.
- Proposals for Student 2 are in handoff.md:
  - the quote test for the live CI suite;
  - optional image sizes;
  - an optional download port.

## Known limitations or blocked checks

- **Mailpit inbox:** emails are counted through Mailpit's search API in the tests. Restarting
  Mailpit empties its in-memory inbox, so the final inbox only held the email sent after that.
- **The draft lives in tab memory:** a reload starts over and signs out (the token is in memory too,
  by D09).
- **The two flaky-test fixes are in my own tests only.** The 1 s Testing Library default can still
  time out other members' tests on a slow runner (Student 3's `pages.test.tsx` is the known one).

## Review

Proposed commit: `krish-b2b` (PR to `development`)
Reviewer: tambevarad (D22)
PR:
Integrated commit:
