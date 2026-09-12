# Student 4 Phase 4

## Outcome

Prove your feature works in the integrated HTTP application and supply final deployment/demo evidence.

## Entry conditions

All quote/auth/notification ports implemented. Persistent upload storage available in chosen deployment.

Read your context.md and current status/evidence first. If previous phase is not integrated, explain the dependency; do not silently skip it. Root context.md and docs/contracts.md remain binding.

## Ordered implementation steps

1. Run full quote journey in HTTP mode with real business login and local SMTP sink. Confirm saved fields/file match review screen, receipt truthful, auth token actually sent.

2. With Student 5 test notification sent/failed outcomes; saved quote remains discoverable by owner. With Student 1 test expiry while wizard draft exists: login recovery preserves safe draft and requires file reselection if route remount loses File.

3. Exercise back/edit/language toggle/mobile/keyboard behavior with real network delays and upload failures. Final submission creates a new requestId only after meaningful edits/new request; retries retain prior id.

4. Verify deployment private upload directory survives restart and is inaccessible via static path. Download through authenticated endpoint works with correct disposition; no public S3 URLs introduced without reviewed change.

5. Finish homepage image optimization/alt text/content slots with supplied assets and register sources. Confirm featured products are live catalog results and empty-state handling works.

6. Prepare 5-minute homepage/B2B segment showing end-to-end request and private file/notification evidence without personal data.

## Acceptance scenarios

- [ ] Business quote saved from live UI, correct PDF stored, email outcome reflected.
- [ ] Restart retains upload; direct public file URL fails.
- [ ] Lost response retry does not duplicate request or email.
- [ ] All four steps usable at375px and by keyboard in both languages.

## Verification and handoff

1. Run `npm run typecheck`, targeted tests under `tests/member-4`, `npm run check`, and `npm run build`.
2. Run `npm run check:ownership -- --member 4 --base development` and resolve accidental edits. Shared approved changes still require the owner's PR.
3. Run manual desktop/mobile, EN/ES and keyboard checks relevant to the steps above. Backend phase also requires real isolated Mongo API checks; mocks alone do not count.
4. Record commands, exact pass/fail counts, manual observations, dependency blockers, public API compatibility and proposed commit in `phase-4-evidence.md`. Screenshots must use synthetic data, no secrets.
5. Update status.json and handoff.md. Never mark a skipped test passed. Stop before commit/push/merge unless explicitly requested. Do not begin the next phase.

## Demo walkthrough

Demonstrate wholesale entry, customization, submitted record, and one protected file retrieval.

## Stop boundary

Do not add unrequested product scope or silently replace real integrations with fixtures. Final release requires all owners and coordinator checks.
