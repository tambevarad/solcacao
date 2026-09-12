# Student 5 Phase 2

## Outcome

Complete your responsive React interaction flow using the typed mock API; no live backend required.

## Entry conditions

Catalog API/locale ports exist. Sampler requests products through api.catalog and uses no separate product IDs.

Read your context.md and current status/evidence first. If previous phase is not integrated, explain the dependency; do not silently skip it. Root context.md and docs/contracts.md remain binding.

## Ordered implementation steps

1. Build ContactPage and FeedbackPage using shared form primitives or native elements until primitives merge. Category, name/email/message validation match shared inquiry schema; errors focusable, pending prevents double-submit.

2. Implement support/mock.ts storing synthetic inquiry receipts in memory with stable requestId retry behavior; simulate failure without losing form state. No real SMTP/network mail in Phase2.

3. Build SamplerPage selecting exactly six pieces across active products from api.catalog.list/get. Repeated choice increases quantity but submit array contains unique productIds. Display count and selection summary; avoid invented sampler pricing.

4. Submit sampler as category=sampler with samplerItems and contact/message fields to same support API. Keep it separate from retail cart to avoid creating a made-up product/order type. Backend validation planned for Phase3.

5. Build StoryPage and CarePage layouts and supplied-content slots. Do not invent certifications/history/health claims or product safety guidance; mark content pending in evidence. Use readable prose layout matching store design.

6. Add WhatsApp link only when valid digits-only VITE_WHATSAPP_NUMBER is configured. Encode a generic enquiry message, open on user click, never auto-send or append private form text.

7. Create support.* EN/ES keys and verify state preservation. For feedback use category=feedback without a separate API contract. Publish notifyQuote input signature already fixed in contracts.md to Student4.

8. Prepare reusable fake notification transport test design and content/asset needs list for later phases.

## Acceptance scenarios

- [ ] Invalid email/short message blocked; API failure retains valid inputs.
- [ ] Sampler refuses5/7 pieces, accepts6, sends unique IDs with quantities.
- [ ] Inactive products not selectable; no unavailable API replaced with local duplicate catalog.
- [ ] WhatsApp absent when number blank; URL encoded when configured.
- [ ] Contact/feedback/sampler keyboard flow and EN/ES switch work.

## Verification and handoff

1. Run `npm run typecheck`, targeted tests under `tests/member-5`, `npm run check`, and `npm run build`.
2. Run `npm run check:ownership -- --member 5 --base development` and resolve accidental edits. Shared approved changes still require the owner's PR.
3. Run manual desktop/mobile, EN/ES and keyboard checks relevant to the steps above. Backend phase also requires real isolated Mongo API checks; mocks alone do not count.
4. Record commands, exact pass/fail counts, manual observations, dependency blockers, public API compatibility and proposed commit in `phase-2-evidence.md`. Screenshots must use synthetic data, no secrets.
5. Update status.json and handoff.md. Never mark a skipped test passed. Stop before commit/push/merge unless explicitly requested. Do not begin the next phase.

## Demo walkthrough

Show support validation, feedback, six-piece sampler and mock receipt, then static content layouts and optional WhatsApp entry.

## Stop boundary

Do not implement Mongoose models, production JWT/SMTP/file storage or live backend routes in this phase. All mock behavior must be disclosed.
