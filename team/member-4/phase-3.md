# Student 4 Phase 3 — Integration & API Bind

Blueprint execution window: Weeks 5–6. Academic checkpoint mapping: docs/roadmap.md. Read context.md, docs/contracts.md, docs/api.json and your member context first. Preserve owner boundaries.

## Entry conditions

Your prior phase must be integrated and current development synchronized. Use published peer ports; report unavailable dependencies without taking over their code.

## Ordered implementation steps

1. Run full quote journey in HTTP mode with real business login and local SMTP sink. Confirm saved fields/file match review screen, receipt truthful, auth token actually sent.

2. With Student 5 test notification sent/failed outcomes; saved quote remains discoverable by owner. With Student 1 test expiry while wizard draft exists: login recovery preserves safe draft and requires file reselection if route remount loses File.

3. Exercise back/edit/language toggle/mobile/keyboard behavior with real network delays and upload failures. Final submission creates a new requestId only after meaningful edits/new request; retries retain prior id.

4. Verify the configured private upload directory survives restart and is inaccessible via static path. Download through authenticated endpoint works with correct disposition; no public S3 URLs introduced without reviewed change.

5. Finish homepage image optimization/alt text/content slots with supplied assets and register sources. Confirm featured products are live catalog results and empty-state handling works.

6. Prepare 5-minute homepage/B2B segment showing end-to-end request and private file/notification evidence without personal data.

Integration emphasis: complete React-to-Express binding now (Weeks5–6), not in Phase4. Audit database-trigger needs: record that no triggers are specified, verify equivalent service/atomic-write logic, and do not invent triggers. Perform security code sweeps and verify every ES/EN translation map. Any launch/presentation preparation mentioned above may be drafted now; deployment/final sign-off remains Phase4.

## Acceptance scenarios

- [ ] Business quote saved from live UI, correct PDF stored, email outcome reflected.
- [ ] Restart retains upload; direct public file URL fails.
- [ ] Lost response retry does not duplicate request or email.
- [ ] All four steps usable at375px and by keyboard in both languages.
- [ ] Real API binding, security sweep, trigger audit and ES/EN audit complete.

## Required verification

Run npm run check and npm run build, plus owned behavior/schema tests and visual review. Phase2 includes real backend validation tests as well as mock frontend interactions. Phase3 requires real Mongo/API tests; mocks do not count. Phase4 requires actual launch evidence. Run npm run check:ownership -- --member 4 --base development. Shared docs/config outside ownership go as exact handoff proposals to the owner.

## Handoff and stop

Update phase-3-evidence.md, handoff.md and status.json using real results. Set ready_for_review only when owned checks pass; only a reviewer records integrated after the actual PR merge. A blocked check remains blocked. Every PR needs visual review, passing unit tests and at least one peer approval. Stop before commit/push/merge/deploy unless the teammate explicitly asks. Never implement the next phase automatically.

## Demo

Submit multipart request, show DB record and private file, demonstrate invalid upload and forbidden file access.
