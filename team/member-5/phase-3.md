# Student 5 Phase 3

## Outcome

Complete your validated Express/Mongoose subsystem and matching HTTP adapter with real persistence tests.

## Entry conditions

Student1 DB foundation ready; Student3 getActiveProductsByIds ready for full sampler integration. Notification port must be provided before Student4 completes integration.

Read your context.md and current status/evidence first. If previous phase is not integrated, explain the dependency; do not silently skip it. Root context.md and docs/contracts.md remain binding.

## Ordered implementation steps

1. Implement Inquiry model with unique requestId/hash, category, contact/message, optional sampler snapshots and truthful notificationStatus. Persist before attempting SMTP. Same requestId/body yields original receipt, differing body409.

2. Implement POST /inquiries using shared inquiry schema plus server-side unique sampler IDs and active-product lookup through catalog service port. Reject nonexistent/inactive items and invalid six-piece total. Never trust client-provided product descriptions or prices.

3. Implement Nodemailer transport factory reading environment, with injected test transport. In development use Mailpit or equivalent local sink. Email recipients/from are configured server-side, user email only validated replyTo; sanitize/escape HTML and prevent header injection.

4. Export notifyQuote with exact contract. Build mail from saved request identifiers and required public business fields only; do not attach branding files. Return sent/failed without throwing on SMTP outage. Log only sanitized diagnostics; no full contact body/token.

5. Implement inquiry notification similarly; persisted inquiry remains status received if mail fails. Do not mark sent before transport acknowledgement. No repeated automatic retries sending duplicates on same requestId; document manual operational retry as outside current UI.

6. Add rate limits and body size validation for public inquiries. Feedback shares same route. Register only your router; coordinate shared app changes through Student1.

7. Implement support/http.ts exact endpoint and error mappings. Test adapter round trip and successful save despite failed notification; keep frontend mock mode until phase4.

8. Write isolated Mongo + SMTP sink integration tests, fixture content only. Update environment/deployment mail section and provide Student4 a passing notifyQuote test/handoff.

## Acceptance scenarios

- [ ] Support/feedback records saved and mail captured locally, never sent to real team.
- [ ] Malformed injection strings escaped; arbitrary recipient fields rejected.
- [ ] Missing/inactive sampler product rejected even if browser accepted it.
- [ ] SMTP outage returns received receipt with failed status and keeps DB record.
- [ ] Idempotent retry creates one inquiry and one notification attempt.

## Verification and handoff

1. Run `npm run typecheck`, targeted tests under `tests/member-5`, `npm run check`, and `npm run build`.
2. Run `npm run check:ownership -- --member 5 --base development` and resolve accidental edits. Shared approved changes still require the owner's PR.
3. Run manual desktop/mobile, EN/ES and keyboard checks relevant to the steps above. Backend phase also requires real isolated Mongo API checks; mocks alone do not count.
4. Record commands, exact pass/fail counts, manual observations, dependency blockers, public API compatibility and proposed commit in `phase-3-evidence.md`. Screenshots must use synthetic data, no secrets.
5. Update status.json and handoff.md. Never mark a skipped test passed. Stop before commit/push/merge unless explicitly requested. Do not begin the next phase.

## Demo walkthrough

Submit contact/feedback/sampler APIs, inspect records and local mail, then stop SMTP and show saved-with-notification-failure behavior.

## Stop boundary

Do not redesign completed UI, change DTOs unilaterally or claim final integration/deployment. Supply working API evidence and adapter.
