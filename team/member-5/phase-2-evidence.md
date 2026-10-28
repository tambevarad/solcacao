# Member 5 Phase 2 evidence — PR #10

Date: 2026-10-27. Member: Daniel Yglesias (5). Requirement IDs: SUP-01–SUP-05.
State: ready_for_review; not integrated and not an academic submission record.
PR: https://github.com/tambevarad/solcacao/pull/10

## Scope, source and branch

Follow docs/roadmap.md and the canonical phase-2.md: Phase 2 includes React components,
individual REST routes, validation tests and client state. The academic frontend checkpoint
(15%) and its required demo are included; they do not replace the backend track.

Work remains on daniel-phase2 with coordinator Varad Tambe's agreement for PR #10 only.
The initial checkout was clean at bc5b3df. git fetch origin found no missing development
commits, so no merge was necessary. No rebase, force-push, branch rename/delete, approval
or merge was performed. Phase 1 remains not_started; D21 authorizes Phase 2 work anyway.
Phase 3 will use the roster branch daniel-support through npm run setup -- --member 5,
when that phase is explicitly started after the reviewed integration.

## Delivered behavior and paths

- client/src/features/support: validated contact/wholesale enquiry and feedback forms;
  pending lock, focusable errors, retained retry values and disclosed mock receipts.
- Catalog-backed six-piece sampler: unique product lines, quantity/count/summary updates,
  active products only, loading/error/empty recovery, no invented sampler price or cart order.
- EN/ES Story and Care informational views, localized links/metadata and approved-library images.
  Copy uses supplied platform facts and does not invent history, certifications or safety advice.
- Configured, user-activated WhatsApp redirection with encoded generic text. No business number
  exists yet; the link remains hidden. No external messages or production mail were sent.
- server/src/features/support: strict Inquiry validation, model and requestId/hash idempotency;
  active sampler product/name snapshots via Student 3's public service; public rate/body limits;
  persist-before-notify SMTP bridge with failed/pending status retained and exact notifyQuote port.
- Mock and HTTP adapters preserve existing DTOs, route signatures and envelope behavior.
- Owned tests cover validation, retries/concurrency, HTTP round trip, state/locale retention,
  injected notification failures and actual Nodemailer SMTP to a loopback-only test sink.
  These checks do not prove Mongo persistence.

## Coordinator review items applied

1. PR #10 base changed from main to development. Its original 354-file comparison narrowed
   to 36 files before these follow-up changes. The old gh pr edit command failed on deprecated
   Projects (classic) GraphQL fields; the same authorized change succeeded through gh api.
2. The exact two-line stale Member 4 inquiry assertion was replaced with the requested
   400/VALIDATION_ERROR assertions. Applied in 747bdbe, a separate commit whose body records
   coordinator approval for PR #10. All B2B authentication assertions remain unchanged.
3. Singular sampler card/summary keys added in both locales, selected only for quantity 1.
   Existing plural keys remain; Spanish plural is {count} seleccionadas. Regression coverage
   checks 0/1/2 quantities and EN/ES. Committed in 74137d6.
4. Sampler uses two columns from the smallest width, three at lg, smaller phone gaps and no
   description below sm. Quantity controls keep their accessible names and at least 44×44 px
   targets. Committed in 47e5a86, with browser geometry/visibility assertions.
5. Useful feature table, remaining tasks and demo checklist moved to checklist.md. The playbook
   was restored using git checkout origin/development -- team/member-5/phase-2.md and verified
   identical to that reference. No misleading frontend-only override remains in the playbook.

## Checks actually run

| Command/check                                                                           | Actual result                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| npx vitest run tests/member-4/quote-api.test.ts --reporter=dot                          | PASS: 16 tests, including the exact approved assertion update.                                                                                                                                                                         |
| npx vitest run tests/member-5/pages.test.tsx tests/member-2/i18n.test.ts --reporter=dot | PASS: 29 tests, including singular/plural EN/ES behavior and dictionary consistency.                                                                                                                                                   |
| npm run check, first attempt                                                            | FAILED on six WSL worker-start timeouts. 316 tests that started passed; 32 skipped. This incomplete attempt was not counted as a pass.                                                                                                 |
| taskset -c 0-3 npm run check                                                            | PASS: unchanged full check with reduced WSL worker concurrency; 352 passed, 32 skipped; 31 test files passed, 3 skipped. Typecheck, structure and workflow checks passed. No tests, assertions or type checks were disabled.           |
| npm run build                                                                           | PASS: client and compiled server. Advisory: shared JS chunk 535.99 kB exceeds 500 kB; no configuration was altered to hide it.                                                                                                         |
| npm run check:ownership -- --member 5 --base origin/development                         | Expected exit 1: ONLY tests/member-4/quote-api.test.ts, the explicit coordinator-approved exception for PR #10. All other changed paths are owned.                                                                                     |
| npm run test:e2e                                                                        | PASS: all 11 shared browser tests, including EN/ES overflow and keyboard navigation.                                                                                                                                                   |
| npx playwright test --config tests/member-5/playwright.config.ts                        | PASS: 5 tests. Includes sampler cards in the same row, touch-target dimensions, phone-hidden descriptions, all support routes at 375/768/1440 in EN/ES, failure recovery, keyboard flow and six-piece submission.                      |
| Interactive browser/screenshot review                                                   | PASS: 18 journeys (contact, feedback, sampler × EN/ES × 375/768/1440), no document overflow and no uncaught page errors. Inputs were driven through Chromium/Playwright and screenshots inspected; this is not a human classroom demo. |
| Playbook equality                                                                       | PASS: git diff --exit-code origin/development -- team/member-5/phase-2.md.                                                                                                                                                             |
| Docker availability                                                                     | UNAVAILABLE: no usable Docker command/daemon in WSL. npm run services and real Mongo verification were NOT RUN in this follow-up.                                                                                                      |
| tests/member-5/mongo.test.ts with real Mongo                                            | NOT RUN: no Docker/test Mongo instance. Its one test skips explicitly without TEST_MONGODB_URI.                                                                                                                                        |

The 32 skipped full-suite tests are Member 3 persistence (21), Member 4 quote persistence (10)
and Member 5 Mongo (1). They are not database integration passes. The Member 5 tests inside
that full run are 26 passed and 1 skipped. Earlier failures/results are retained in Git history;
the former stale-404 npm run check failure has been fixed and is no longer the current result.

## Browser review and screenshots

At each width and language, contact and feedback rejected invalid fields, focused the error
summary, accepted keyboard entry through name/email/message, retained entries after simulated
failure, and returned a truthful demo receipt on retry. Contact topic/form state survived locale
switching. The sampler displayed correct singular/plural text, kept two adjacent cards, provided
44 px controls, rejected five pieces, accepted six, and preserved form values after validation.

Representative screenshots (synthetic inputs; shared approved stock imagery):

- [375 px, Spanish sampler](screenshots/pr10-sampler-375-es.png)
- [768 px, English sampler](screenshots/pr10-sampler-768-en.png)
- [1440 px, Spanish sampler](screenshots/pr10-sampler-1440-es.png)

All six sampler width/language screenshots were inspected. The wider selection screenshots and
18-journey machine-readable results remain locally under .agent/pr10-review (ignored artifacts).
No real personal data, secrets, actual business WhatsApp number or production content was added.

## Limitations and peer handoff

- Real Mongo persistence is still a blocker for integration evidence; no database success is claimed.
  The original isolated Mongo test only accepts solcacao_test_* database names; the requested
  solcacao-test URI was not used because Docker was unavailable. If services become available,
  reconcile that test-database naming guard explicitly before running it; do not point tests at
  a development or production database.
- Shared DB bootstrap/connection/index initialization and global JSON error alignment remain
  Student 1 integration handoffs. No shared server infrastructure was changed here.
- Student 4 receives the fixed notifyQuote signature and its passing fake/loopback SMTP checks;
  quotes must be saved before notification and the returned status persisted. No design file attached.
- A real WhatsApp destination, student/classroom demo, formal peer approval and merge remain pending.
- CI is checked on the pushed PR head; its final result/link is recorded in the PR and completion report.
  Local passing checks are not treated as a substitute for the GitHub result.

Proposed final documentation commit: docs(member-5): restore playbook, update evidence.
