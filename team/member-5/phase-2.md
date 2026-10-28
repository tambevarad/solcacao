# Student 5 Phase 2 — Core Development

Blueprint execution window: Weeks 3–4. Academic checkpoint mapping: docs/roadmap.md. Read context.md, docs/contracts.md, docs/api.json and your member context first. Preserve owner boundaries.

## Entry conditions

Your prior phase must be integrated and current development synchronized. Use published peer ports; report unavailable dependencies without taking over their code.

## Ordered implementation steps

### Frontend track

1. Build ContactPage and FeedbackPage using shared form primitives or native elements until primitives merge. Category, name/email/message validation match shared inquiry schema; errors focusable, pending prevents double-submit.

2. Implement support/mock.ts storing synthetic inquiry receipts in memory with stable requestId retry behavior; simulate failure without losing form state. No real SMTP/network mail in Phase2.

3. Build SamplerPage selecting exactly six pieces across active products from api.catalog.list/get. Repeated choice increases quantity but submit array contains unique productIds. Display count and selection summary; avoid invented sampler pricing.

4. Submit sampler as category=sampler with samplerItems and contact/message fields to same support API. Keep it separate from retail cart to avoid creating a made-up product/order type. Backend validation planned for Phase3.

5. Build StoryPage and CarePage layouts and supplied-content slots. Do not invent certifications/history/health claims or product safety guidance; mark content pending in evidence. Use readable prose layout matching store design.

6. Add WhatsApp link only when valid digits-only VITE_WHATSAPP_NUMBER is configured. Encode a generic enquiry message, open on user click, never auto-send or append private form text.

7. Create support.* EN/ES keys and verify state preservation. For feedback use category=feedback without a separate API contract. Publish notifyQuote input signature already fixed in contracts.md to Student4.

8. Prepare reusable fake notification transport test design and content/asset needs list for later phases.

### Backend track

1. Implement Inquiry model with unique requestId/hash, category, contact/message, optional sampler snapshots and truthful notificationStatus. Persist before attempting SMTP. Same requestId/body yields original receipt, differing body409.

2. Implement POST /inquiries using shared inquiry schema plus server-side unique sampler IDs and active-product lookup through catalog service port. Reject nonexistent/inactive items and invalid six-piece total. Never trust client-provided product descriptions or prices.

3. Implement Nodemailer transport factory reading environment, with injected test transport. In development use Mailpit or equivalent local sink. Email recipients/from are configured server-side, user email only validated replyTo; sanitize/escape HTML and prevent header injection.

4. Export notifyQuote with exact contract. Build mail from saved request identifiers and required public business fields only; do not attach branding files. Return sent/failed without throwing on SMTP outage. Log only sanitized diagnostics; no full contact body/token.

5. Implement inquiry notification similarly; persisted inquiry remains status received if mail fails. Do not mark sent before transport acknowledgement. No repeated automatic retries sending duplicates on same requestId; document manual operational retry as outside current UI.

6. Add rate limits and body size validation for public inquiries. Feedback shares same route. Register only your router; coordinate shared app changes through Student1.

7. Implement support/http.ts exact endpoint and error mappings. Test adapter round trip and successful save despite failed notification; keep frontend mock mode until Phase 3.

8. Write isolated Mongo + SMTP sink integration tests, fixture content only. Update environment/deployment mail section and provide Student4 a passing notifyQuote test/handoff.

## Acceptance scenarios

- [ ] Invalid email/short message blocked; API failure retains valid inputs.
- [ ] Sampler refuses5/7 pieces, accepts6, sends unique IDs with quantities.
- [ ] Inactive products not selectable; no unavailable API replaced with local duplicate catalog.
- [ ] WhatsApp absent when number blank; URL encoded when configured.
- [ ] Contact/feedback/sampler keyboard flow and EN/ES switch work.
- [ ] Support/feedback records saved and mail captured locally, never sent to real team.
- [ ] Malformed injection strings escaped; arbitrary recipient fields rejected.
- [ ] Missing/inactive sampler product rejected even if browser accepted it.
- [ ] SMTP outage returns received receipt with failed status and keeps DB record.
- [ ] Idempotent retry creates one inquiry and one notification attempt.

## Required verification

Run npm run check and npm run build, plus owned behavior/schema tests and visual review. Phase2 includes real backend validation tests as well as mock frontend interactions. Phase3 requires real Mongo/API tests; mocks do not count. Phase4 requires actual launch evidence. Run npm run check:ownership -- --member 5 --base development. Shared docs/config outside ownership go as exact handoff proposals to the owner.

## Handoff and stop

Update phase-2-evidence.md, handoff.md and status.json using real results. Set ready_for_review only when owned checks pass; only a reviewer records integrated after the actual PR merge. A blocked check remains blocked. Every PR needs visual review, passing unit tests and at least one peer approval. Stop before commit/push/merge/deploy unless the teammate explicitly asks. Never implement the next phase automatically.

## Demo

Show support validation, feedback, six-piece sampler and mock receipt, then static content layouts and optional WhatsApp entry.
