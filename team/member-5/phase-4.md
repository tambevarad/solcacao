# Student 5 Phase 4

## Outcome

Prove your feature works in the integrated HTTP application and supply final deployment/demo evidence.

## Entry conditions

Live auth/catalog/support/B2B APIs available; configured SMTP sink or authorized production transport ready.

Read your context.md and current status/evidence first. If previous phase is not integrated, explain the dependency; do not silently skip it. Root context.md and docs/contracts.md remain binding.

## Ordered implementation steps

1. Connect all support forms and sampler through HTTP mode. Verify real Product IDs reach inquiry and snapshot descriptions match server catalog, not user-tampered browser state.

2. With Student4 test successful/failed quote notification and duplicates. Correct business copy so received request is distinguished from email delivery and no price/fulfillment promise is made.

3. Check public forms with network timeouts,429,invalid fields, duplicate submit and failed SMTP. Preserve edits; same logical retry uses same id. Message length/error translation identical across client and backend.

4. Finish supplied story/care content and asset register; check all support links and configured WhatsApp number. Leave missing actual business contact values documented and unexposed rather than guessing.

5. Audit accessibility on form labels, validation summary, sampler selection controls, keyboard focus, EN/ES wrapping and mobile tap targets.

6. Document SMTP setup and safe test sink, notification failure semantics and sampler default. Prepare 4-minute support/sampler/notification demo and sanitized evidence.

## Acceptance scenarios

- [ ] Live six-piece sampler saves one inquiry and locally captured mail with correct products.
- [ ] Retry after network loss does not duplicate inquiry/mail.
- [ ] SMTP unavailable never loses submitted inquiry; UI reports saved state truthfully.
- [ ] No private values in WhatsApp URL, client bundle or logs.

## Verification and handoff

1. Run `npm run typecheck`, targeted tests under `tests/member-5`, `npm run check`, and `npm run build`.
2. Run `npm run check:ownership -- --member 5 --base development` and resolve accidental edits. Shared approved changes still require the owner's PR.
3. Run manual desktop/mobile, EN/ES and keyboard checks relevant to the steps above. Backend phase also requires real isolated Mongo API checks; mocks alone do not count.
4. Record commands, exact pass/fail counts, manual observations, dependency blockers, public API compatibility and proposed commit in `phase-4-evidence.md`. Screenshots must use synthetic data, no secrets.
5. Update status.json and handoff.md. Never mark a skipped test passed. Stop before commit/push/merge unless explicitly requested. Do not begin the next phase.

## Demo walkthrough

Show sampler and contact submission with DB/mail evidence and one graceful failure case.

## Stop boundary

Do not add unrequested product scope or silently replace real integrations with fixtures. Final release requires all owners and coordinator checks.
