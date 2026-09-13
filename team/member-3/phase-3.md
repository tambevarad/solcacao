# Student 3 Phase 3 — Integration & API Bind

Blueprint execution window: Weeks 5–6. Academic checkpoint mapping: docs/roadmap.md. Read context.md, docs/contracts.md, docs/api.json and your member context first. Preserve owner boundaries.

## Entry conditions

Your prior phase must be integrated and current development synchronized. Use published peer ports; report unavailable dependencies without taking over their code.

## Ordered implementation steps

1. Run catalog/product/cart/checkout through HTTP adapters against seeded Mongo. Remove Phase 2 direct fixture leakage and check no fallback exists. Confirm loading/error states for network failures.

2. With Student 1 verify guest login merge, retry on lost response, role change/account switch, logout and revision conflict. Keep failed guest merge data until confirmed server success.

3. With Students 4/5 verify homepage featured products and sampler both use your public API, same IDs/prices/images, and active/stock semantics. Resolve integration via contracts, not duplicate fixture copies.

4. Implement real browser scenarios for filters->cart->login->merge->checkout including EN/ES switch, mobile drawer and stale-stock checkout. Test quantity totals and persisted DB records, not just success toast.

5. Optimize measured filter queries/indexes and image loading; preserve sort correctness. Confirm production seed is opt-in and no reset endpoint exists.

6. Document cart algorithm, simulated-order limitations, API examples and demo reset procedure. Prepare a 5-minute retail demo with one merge/stock edge case.

Integration emphasis: complete React-to-Express binding now (Weeks5–6), not in Phase4. Audit database-trigger needs: record that no triggers are specified, verify equivalent service/atomic-write logic, and do not invent triggers. Perform security code sweeps and verify every ES/EN translation map. Any launch/presentation preparation mentioned above may be drafted now; deployment/final sign-off remains Phase4.

## Acceptance scenarios

- [ ] Real saved cart persists across logout/login and separate page load after reauthentication.
- [ ] UI subtotal and server order total agree with DB prices, not modified browser values.
- [ ] Changing language does not lose cart/filter/product selection.
- [ ] Simulated order is labeled correctly and inventory remains unchanged.
- [ ] Real API binding, security sweep, trigger audit and ES/EN audit complete.

## Required verification

Run npm run check and npm run build, plus owned behavior/schema tests and visual review. Phase2 includes real backend validation tests as well as mock frontend interactions. Phase3 requires real Mongo/API tests; mocks do not count. Phase4 requires actual launch evidence. Run npm run check:ownership -- --member 3 --base development. Shared docs/config outside ownership go as exact handoff proposals to the owner.

## Handoff and stop

Update phase-3-evidence.md, handoff.md and status.json using real results. Set ready_for_review only when owned checks pass; only a reviewer records integrated after the actual PR merge. A blocked check remains blocked. Every PR needs visual review, passing unit tests and at least one peer approval. Stop before commit/push/merge/deploy unless the teammate explicitly asks. Never implement the next phase automatically.

## Demo

Show product queries and pagination, authenticated saved cart, duplicate merge proof, and one simulated Order document with correct totals.
