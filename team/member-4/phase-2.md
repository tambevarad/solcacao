# Student 4 Phase 2

## Outcome

Complete your responsive React interaction flow using the typed mock API; no live backend required.

## Entry conditions

Catalog/auth/locale public ports exist. Use api.catalog for featured products; no internal fixture imports.

Read your context.md and current status/evidence first. If previous phase is not integrated, explain the dependency; do not silently skip it. Root context.md and docs/contracts.md remain binding.

## Ordered implementation steps

1. Build HomePage using design.md section order with original placeholder image slots, hero slides and seasonal entry points. Controls accessible, reduced motion respected; link categories through canonical catalog query values.

2. Build WholesalePage explaining custom molds/branding, packaging and white-label services with original example placeholders. One clear start-customization action. Keep real business claims absent until supplied.

3. Implement a reducer/state machine for exactly four wizard steps per contract; maintain one QuoteInput draft and File state. Back/next preserves data; validation gates only current step then full validation at review. Step 4 shows all selected options and sanitized filename.

4. Add visual cacao and packaging choices, quantity input min50/max100000, business/contact fields and PDF upload control max5MiB. Client prevalidation assists user but is not claimed security. File can be replaced/removed before submission.

5. Integrate auth public access wrapper: guest -> safe login return, retail -> business explanation, b2b -> wizard. If Student 1 wrapper pending, test controlled user states through provider harness and list wiring blocker; do not implement auth yourself.

6. Implement b2b/mock.ts submit with deterministic receipt, injected success/failure states and requestId reuse on retry. Keep draft/file on error, disable pending submission, clear only after confirmed success. Mark demo requests as mock in evidence/UI development notice.

7. Add b2b.* translations and verify switching language keeps current step, values and in-memory file. Page reload explicitly requires reselecting file. Do not write corporate file data to browser storage.

8. Publish UI routes/guard request and notification field requirements in handoff to Students 1/2/5.

## Acceptance scenarios

- [ ] Cannot skip required step values; back/edit/review consistent.
- [ ] Wrong type or >5MiB upload is rejected; replacing file updates summary.
- [ ] Language switch at step3 preserves file/quantity/packaging.
- [ ] Failed submit keeps all draft data; retry uses same requestId until edits create a new submission.
- [ ] Retail cannot reach submission UI; b2b can.

## Verification and handoff

1. Run `npm run typecheck`, targeted tests under `tests/member-4`, `npm run check`, and `npm run build`.
2. Run `npm run check:ownership -- --member 4 --base development` and resolve accidental edits. Shared approved changes still require the owner's PR.
3. Run manual desktop/mobile, EN/ES and keyboard checks relevant to the steps above. Backend phase also requires real isolated Mongo API checks; mocks alone do not count.
4. Record commands, exact pass/fail counts, manual observations, dependency blockers, public API compatibility and proposed commit in `phase-2-evidence.md`. Screenshots must use synthetic data, no secrets.
5. Update status.json and handoff.md. Never mark a skipped test passed. Stop before commit/push/merge unless explicitly requested. Do not begin the next phase.

## Demo walkthrough

Show homepage, wholesale service entry, business login, four steps with sample PDF, error recovery and mock receipt.

## Stop boundary

Do not implement Mongoose models, production JWT/SMTP/file storage or live backend routes in this phase. All mock behavior must be disclosed.
