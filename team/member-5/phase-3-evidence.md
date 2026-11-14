# Member 5 Phase 3 evidence

Date: November 14, 2026. Branch: daniel-support, based on origin/development a1a8f9d.
Both phases authorized together under D22. Daniel authorized commit/push/PR publication on
November 14 after these checks; deployment and integration are not claimed.

## Delivered behavior

- Contact, feedback and six-piece sampler bind through api.support/api.catalog and real Express/MongoDB.
- Server resolves active product IDs, persists canonical name snapshots, and sends localized quantities/names/IDs in escaped sampler email. Browser-supplied names and unknown IDs are rejected.
- Unchanged retries reuse the request ID after lost responses, 20-second timeouts, field errors and 429. Pending-submit protection prevents double clicks; failures retain entries and selection. No automatic retry or HTTP-to-mock fallback.
- Saved enquiry and notification status remain separate. SMTP failure never erases the saved request or tells the visitor to resubmit it. Quote email wording makes no pricing, production or delivery promise.
- Real registration and Krish's merged quote route verify sent, duplicate and failed notifications. No peer implementation changed.
- Story/Care copy describes documented journeys without invented business claims; asset-register.md records existing approved imagery. Missing WhatsApp destination stays hidden.
- Keyboard/focus, summary links, labels, sampler controls, EN/ES and responsive wrapping are covered by owned browser checks.
- SMTP setup, live inbox configuration, safe loopback test sink and crash/pending semantics are documented in the owned backend README.

## Commands and exact results

All verification used TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test_ci.
Unit and shared mock-browser commands also used VITE_API_MODE=mock; HTTP browser config forces http.

| Command/check                                    | Result                                                                                                                           |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Node / gh / setup                                | Node v24.19.0; gh authenticated as danielyglesias; npm run setup -- --member 5 passed; PR #26 and Reethika's PR #30 present      |
| npm run services                                 | Passed after fresh WSL group membership and stopping the older local Mongo/Mailpit processes; Docker mongo:8.0 and Mailpit v1.27 |
| npm run seed:catalog                             | Passed: 15 fictional fixtures upserted, nothing deleted                                                                          |
| npm run dev + setup smoke                        | 3 passed, 0 skipped, 0 failed: /en/catalog API 200, synthetic registration 201, Mailpit UI 200; dev server stopped               |
| npm run agent for phases 3 and 4                 | Both packets generated/read; D22 permits the paired turn                                                                         |
| Final taskset -c 0-3 npm run check on Linux copy | 584 passed, 0 skipped, 0 failed across 47 files; typecheck, structure and workflow also passed                                   |
| Member 5 tests within that full run              | 52 passed, 0 skipped, 0 failed; includes 5 real-app HTTP/Mongo/SMTP tests and the existing Mongo persistence test                |
| npm run build                                    | Passed in checkout and on the Linux source copy; typechecks and compiled server passed                                           |
| npx playwright install chromium                  | Passed                                                                                                                           |
| Owned HTTP browser suite                         | 8 passed, 0 skipped, 0 failed: real Mongo/Mailpit, snapshots, response loss, timeout, fields, outage, real 429, widths/locales   |
| Owned mock visual suite                          | 7 passed, 0 skipped, 0 failed; mock evidence only                                                                                |
| npm run test:e2e                                 | 15 passed, 0 skipped, 0 failed; shared mock regression, not persistence evidence                                                 |
| Deployed Member 5 suite                          | 5 passed, 0 skipped, 0 failed; details in phase-4-evidence.md                                                                    |
| check:ownership --member 5 --base development    | Exit 1 solely for unrelated, pre-existing untracked .vscode/settings.json; preserved, excluded from proposed commit              |

Final successful tests ran on an identical Linux-filesystem source copy to avoid mounted-Windows
import timeouts. source-verification.json records byte equality for 243 current source/test/config
files and their aggregate SHA-256. Dependencies came from the same lockfile; no test or type
suppression was introduced. Local .env and credentials were excluded from that copy.

## Failure history (not passing evidence)

- First mounted-checkout full run: 490 passed, 3 failed, 2 skipped, 10 worker errors; 35 files passed, 2 failed. Worker startup/import and UI timing failures.
- Four-CPU mounted retry: 561 passed, 2 failed, 2 skipped, 1 worker error; 43 files passed, 3 failed. Import/hook timeouts persisted.
- First Linux-copy run: 583 passed, 1 failed, 0 skipped. New Member 5 summary-focus assertion raced React's passive effect. Changed the test to wait for the effect while preserving the focus assertion; final run passed 584/584.
- HTTP browser rerun before harness cleanup fix: 3 passed, 1 failed, 4 did not run. The prior outage left Mailpit stopped, so the sent-email assertion correctly failed. Added explicit container startup/readiness and afterAll restoration. Subsequent full HTTP rerun: 8 passed, 0 skipped, 0 failed.
- Docker initially unavailable in WSL, then blocked by socket group membership and pre-existing local listeners. All resolved; final tests use Docker services.
- npm ci reported 17 audit findings: 7 moderate, 7 high, 3 critical. No unsolicited dependency upgrade; owner/coordinator should triage separately.

## Security and trigger audit

Sanitized browser captures are in `team/member-5/screenshots/phase3-http-*.png`: phone/desktop
Spanish sampler layout, saved sampler receipt and Spanish SMTP-failure receipt. Inspected the
phone layout and failure receipt; no overflowing text or private credentials are visible.
Offscreen sampler images may remain unloaded in full-page captures because loading is lazy.

No MongoDB triggers are specified. Unique requestId indexes, canonical payload hashes,
insert-before-notify ordering and atomic notification-status updates provide the required behavior.
Concurrent duplicates create one inquiry and one email. A crash/status-write failure may leave
pending; no resend worker is claimed. SMTP recipients/from/subjects are server-owned; email HTML
is escaped, replyTo validated, transport timeouts bounded, and file/URL access disabled. Logs use
fixed diagnostics. Browser drafts/IDs are in memory, with no PII/token persisted by support.

Resolved blocker: Shared JSON parser error-code alignment. Inspection and real-app tests confirm
malformed JSON returns 400 and oversized JSON 413, both VALIDATION_ERROR. No shared file changed.
Remote synchronization and real local HTTP/Mongo/Mailpit evidence are now resolved as well.

## Review and limits

Cleanup verification (November 14): simplified error-key selection and explicit receipt typing,
strengthened the existing quote-mail assertions for EN/ES and no pricing/production/delivery
promise, removed superseded Phase 2 handoff material, and corrected presentation text encoding.
Full check again passed 584 tests, 0 skipped/failed; HTTP-mode production build passed. The
official ownership checker passed all 35 proposed files on the isolated source tree. The copy's
executable-bit setting was matched to this Windows checkout to remove copy-only mode changes;
no source ownership rule or ignore rule was changed. The full checkout still flags the preserved
untracked editor file. `commit-scope.md` lists every proposed file and safe staging commands.

Implementation commit: `29aaf06`. PR: https://github.com/tambevarad/solcacao/pull/31 into development.
Review requested from tambevarad; approval and integration are not claimed.
Proposed commit: feat(support): complete HTTP and live-mail verification for phases 3 and 4.
Missing actual WhatsApp number remains documented and unexposed. Human visual approval and
presentation rehearsal remain pending. Shared sampler test is an exact proposal in handoff.md;
Member 2 integrates it in a separate reviewed change. Phase 4 deployment evidence describes the
existing deployed version; the coordinator must repeat it after merging/deploying these changes.
