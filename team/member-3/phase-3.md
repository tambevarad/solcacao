# Student 3 Phase 3

## Outcome

Complete your validated Express/Mongoose subsystem and matching HTTP adapter with real persistence tests.

## Entry conditions

Phase 2 catalog reviewed. Student 1 shared db/auth middleware must be merged before protected endpoint tests; use published interfaces, not local duplicate middleware.

Read your context.md and current status/evidence first. If previous phase is not integrated, explain the dependency; do not silently skip it. Root context.md and docs/contracts.md remain binding.

## Ordered implementation steps

1. Implement Product, Inventory, Cart and Order schemas/indexes and DTO serializers. Product stock joins Inventory.availableUnits; monetary fields integers. Create one explicit idempotent fixture seed command, no production auto-seed/drop.

2. Implement GET products and slug route. Parse query primitives explicitly, escape literal search, whitelist sort and filters; validate bounds and cap page size. Query total and items consistently. Test localized names and tie-breaker order.

3. Export getActiveProductsByIds port returning DTOs to Student 5. Keep Mongoose internals private. Document missing IDs excluded and inventory stock included.

4. Implement GET cart and POST persist with authenticated user ownership and atomic expectedRevision condition. Validate distinct IDs/count/quantities against active product stock; map concurrent conflict to409. No body userId accepted.

5. Implement atomic merge with bounded stored mergeIds in same cart document, additive capped quantities and revision increment. Test retry after lost response and concurrent duplicate requests. Initial-cart creation race must be handled with unique userId; never read-modify-save without conflict protection.

6. Implement POST orders with optionalAuth, shared checkout validation, authoritative price/product snapshots and unique requestId/body hash. Same request returns same receipt; different payload conflicts. Validate stock without decrement because orders are simulated.

7. Implement all catalog/http.ts methods with exact routes and query encoding; test optional undefined values not becoming string undefined. Update error UI mappings only in your feature.

8. Add real isolated Mongo tests for filters, ownership, atomic merges/revisions, stock validation and duplicate checkout. Preserve mocked frontend mode for Phase 2 while proving HTTP adapter separately.

## Acceptance scenarios

- [ ] Raw Mongo operators in URL/body cannot change query/ownership.
- [ ] Two competing persist requests cannot both overwrite same revision.
- [ ] Two same-mergeId requests add guest contents once; initial cart race handled.
- [ ] One user cannot target another cart; no untrusted price accepted.
- [ ] Orders persist exact authoritative totals and retries create one order.

## Verification and handoff

1. Run `npm run typecheck`, targeted tests under `tests/member-3`, `npm run check`, and `npm run build`.
2. Run `npm run check:ownership -- --member 3 --base development` and resolve accidental edits. Shared approved changes still require the owner's PR.
3. Run manual desktop/mobile, EN/ES and keyboard checks relevant to the steps above. Backend phase also requires real isolated Mongo API checks; mocks alone do not count.
4. Record commands, exact pass/fail counts, manual observations, dependency blockers, public API compatibility and proposed commit in `phase-3-evidence.md`. Screenshots must use synthetic data, no secrets.
5. Update status.json and handoff.md. Never mark a skipped test passed. Stop before commit/push/merge unless explicitly requested. Do not begin the next phase.

## Demo walkthrough

Show product queries and pagination, authenticated saved cart, duplicate merge proof, and one simulated Order document with correct totals.

## Stop boundary

Do not redesign completed UI, change DTOs unilaterally or claim final integration/deployment. Supply working API evidence and adapter.
