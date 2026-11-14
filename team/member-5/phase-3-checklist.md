# Member 5 Phases 3 and 4 checklist

Current authorization: complete both phases under D22, then commit, push and open one PR for
tambevarad to review. This supersedes the earlier local-only draft. Branch: daniel-support.

- [x] Read shared contracts, both phase plans, current implementation and status.
- [x] Synchronize through setup; development contains PR #26 and Reethika's PR #30.
- [x] Node 24.19.0, authenticated GitHub CLI, Docker MongoDB 8 and Mailpit verified.
- [x] HTTP environment, seed, homepage/catalog 200, synthetic registration 201, Mailpit 200.
- [x] Phase 3 step 1: real product IDs, server snapshots, escaped/localized sampler mail.
- [x] Step 2: authenticated quote route: accepted, duplicate and failed SMTP notifications.
- [x] Step 3: timeout/lost response, invalid fields, pending submits, 429, Mailpit outage and stable retry ID.
- [x] Step 4: factual Story/Care copy, owned asset register; missing WhatsApp stays hidden.
- [x] Step 5: keyboard/focus, 44 px sampler controls, 375/768/1440 widths, EN/ES.
- [x] Step 6: SMTP operations/security/trigger notes and four-minute demo draft.
- [x] Obsolete shared JSON parser alignment blocker resolved; real 400/413 tests pass.
- [x] Phase 4: deployed page and inbox verification in both languages; six synthetic mails captured.
- [x] Phase 4: WebP/loading measurements, reduced-motion inspection and docs.
- [x] Final complete-source checks and evidence/status sign-off (see evidence files).
- [ ] Human review/approval by tambevarad and presentation rehearsal; never self-awarded.
- [ ] Coordinator deploys reviewed changes and repeats deployed checks after merge.

Every verification command uses TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test_ci.
Unit/shared mock browser checks additionally use VITE_API_MODE=mock. Real API/browser suites
force HTTP and use isolated local databases. Mock successes do not count as integration.
