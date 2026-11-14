# Member 5 commit scope

This change covers Phases 3 and 4 together under D22 and the team lead's Member 5 instructions.
Before publication there were no branch-only commits relative to origin/development; merged team
changes are base history. PR #31 adds only the Member 5 implementation and publication records.

| Requirement             | Included work                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------- |
| SUP-01 contact/feedback | HTTP timeout/retry handling and EN/ES errors                                            |
| SUP-02 sampler          | Trusted server product details in mail, snapshot/idempotency tests, lazy-image decoding |
| SUP-03 content          | Story/Care audit, owned asset register and loading measurements                         |
| SUP-04 WhatsApp         | Missing destination documented; hidden-link behavior verified                           |
| SUP-05 notifications    | Localized quote copy, real quote route and SMTP outage/duplicate verification           |
| Phase 3 verification    | Owned API/Mongo/SMTP/browser tests, security/trigger notes, resolved parser blocker     |
| Phase 4 verification    | Deployed journeys and captured mail, keyboard/EN/ES evidence, presentation draft        |
| Handoff                 | Current evidence/status, exact shared sampler-test proposal, PR draft for tambevarad    |

No shared DTO, HTTP route, dependency version, peer feature, shared asset, deployment configuration
or global error handler is edited. Existing catalog regression tests in tests/member-5 remain
unchanged; no catalog feature work is included. Earlier phase results remain in Git history.

The unrelated untracked `.vscode/settings.json` stays local. `.env`, credentials, `.agent` tooling,
dependencies, build output and transient test output are excluded. Do not stage the whole tree.
When committing is authorized, use these four owned directories and review the staged list:

```sh
git add -- client/src/features/support server/src/features/support tests/member-5 team/member-5
git diff --cached --name-only
git diff --cached --check
```

No files were staged, committed or pushed by this cleanup. Human approval and post-merge deployment
remain pending. The full-checkout ownership checker still sees the editor file; the proposed source
tree is checked separately without changing ignore rules or ownership rules.

## Proposed files

```text
client/src/features/support/http.ts
client/src/features/support/InquiryForm.tsx
client/src/features/support/locales/en.json
client/src/features/support/locales/es.json
client/src/features/support/pages/SamplerPage.tsx
client/src/features/support/README.md
server/src/features/support/notifications.ts
server/src/features/support/README.md
server/src/features/support/service.ts
team/member-5/asset-register.md
team/member-5/commit-scope.md
team/member-5/handoff.md
team/member-5/phase-3-checklist.md
team/member-5/phase-3-evidence.md
team/member-5/phase-4-evidence.md
team/member-5/phase-4-performance.json
team/member-5/pr-draft.md
team/member-5/screenshots/phase3-http-feedback-smtp-failed.png
team/member-5/screenshots/phase3-http-sampler-es-1440.png
team/member-5/screenshots/phase3-http-sampler-es-375.png
team/member-5/screenshots/phase3-http-sampler-saved.png
team/member-5/source-verification.json
team/member-5/status.json
tests/member-5/adapters.test.ts
tests/member-5/deployed.spec.ts
tests/member-5/http-browser.spec.ts
tests/member-5/http-browser-server.ts
tests/member-5/http-mongo.test.ts
tests/member-5/integration-db.ts
tests/member-5/notifications.test.ts
tests/member-5/pages.test.tsx
tests/member-5/playwright.deployed.config.ts
tests/member-5/playwright.http.config.ts
tests/member-5/service.test.ts
tests/member-5/smtp-sink.ts
```
