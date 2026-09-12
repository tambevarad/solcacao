# Student 3 Phase 4

## Outcome

Prove your feature works in the integrated HTTP application and supply final deployment/demo evidence.

## Entry conditions

Auth + catalog HTTP implementation integrated; coordinator ready to test HTTP mode.

Read your context.md and current status/evidence first. If previous phase is not integrated, explain the dependency; do not silently skip it. Root context.md and docs/contracts.md remain binding.

## Ordered implementation steps

1. Run catalog/product/cart/checkout through HTTP adapters against seeded Mongo. Remove Phase 2 direct fixture leakage and check no fallback exists. Confirm loading/error states for network failures.

2. With Student 1 verify guest login merge, retry on lost response, role change/account switch, logout and revision conflict. Keep failed guest merge data until confirmed server success.

3. With Students 4/5 verify homepage featured products and sampler both use your public API, same IDs/prices/images, and active/stock semantics. Resolve integration via contracts, not duplicate fixture copies.

4. Implement real browser scenarios for filters->cart->login->merge->checkout including EN/ES switch, mobile drawer and stale-stock checkout. Test quantity totals and persisted DB records, not just success toast.

5. Optimize measured filter queries/indexes and image loading; preserve sort correctness. Confirm production seed is opt-in and no reset endpoint exists.

6. Document cart algorithm, simulated-order limitations, API examples and demo reset procedure. Prepare a 5-minute retail demo with one merge/stock edge case.

## Acceptance scenarios

- [ ] Real saved cart persists across logout/login and separate page load after reauthentication.
- [ ] UI subtotal and server order total agree with DB prices, not modified browser values.
- [ ] Changing language does not lose cart/filter/product selection.
- [ ] Simulated order is labeled correctly and inventory remains unchanged.

## Verification and handoff

1. Run `npm run typecheck`, targeted tests under `tests/member-3`, `npm run check`, and `npm run build`.
2. Run `npm run check:ownership -- --member 3 --base development` and resolve accidental edits. Shared approved changes still require the owner's PR.
3. Run manual desktop/mobile, EN/ES and keyboard checks relevant to the steps above. Backend phase also requires real isolated Mongo API checks; mocks alone do not count.
4. Record commands, exact pass/fail counts, manual observations, dependency blockers, public API compatibility and proposed commit in `phase-4-evidence.md`. Screenshots must use synthetic data, no secrets.
5. Update status.json and handoff.md. Never mark a skipped test passed. Stop before commit/push/merge unless explicitly requested. Do not begin the next phase.

## Demo walkthrough

Run complete retail demo and show one stored order plus retry/merge correctness.

## Stop boundary

Do not add unrequested product scope or silently replace real integrations with fixtures. Final release requires all owners and coordinator checks.
