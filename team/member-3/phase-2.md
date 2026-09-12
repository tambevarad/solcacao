# Student 3 Phase 2 — Core Development

Blueprint execution window: Weeks 3–4. Academic checkpoint mapping: docs/roadmap.md. Read context.md, docs/contracts.md, docs/api.json and your member context first. Preserve owner boundaries.

## Entry conditions

Your prior phase must be integrated and current development synchronized. Use published peer ports; report unavailable dependencies without taking over their code.

## Ordered implementation steps

### Frontend track

1. Create a small explicitly fictional product fixture set owned by catalog, with deterministic 24-hex IDs, both languages, category/origin/cacao range/price variation and at least one inactive/out-of-stock case. Include simple original placeholder images, not Fran’s assets.

2. Implement catalog/mock.ts list/get with exact query semantics, stable pagination/sorting and predictable errors. UI calls api.catalog; expose no fixtures directly to Student 4/5.

3. Build CatalogPage with URL-driven search/filter/sort/page controls and responsive grid. Reset page to 1 when filters change; back/forward restores them. Empty results and API failure are different states. Slider and numeric boundaries agree.

4. Build ProductPage from canonical slug with gallery, ingredient/allergen/care display and add-to-cart controls. Handle nonexistent/inactive slug and stock zero. Keep language selection independent of slug.

5. Implement CartProvider/reducer and CartDrawer via public.tsx stable interface. Add/update/remove/clear, subtotal, count=sum quantities, empty/loading/error states and guest localStorage parsing. Share one instance mounted in main.tsx; no second cart in header or checkout.

6. Implement mock persisted carts, merge and revision conflict behavior consistent with docs/contracts.md. Observe useAuth user transitions; merge only once per guest version, preserve guest state on failure and ignore stale account responses. Mock state can use in-memory maps; never persist auth token/password.

7. Build simulated CheckoutPage and OrderConfirmationPage with validated email/address, review totals, requestId duplicate protection and explicit no-payment copy. In Phase 2 receipt is simulated in memory, not claimed saved to Mongo. Confirmation reload handles absent state.

8. Write all catalog.* EN/ES messages; maintain cart across language toggles. Publish cart exports/fixture API for homepage and sampler owners and document stock adjustment/conflict UX.

### Backend track

1. Complete and verify the Phase1 Product, Inventory, Cart and Order schemas/indexes and DTO serializers. Product stock joins Inventory.availableUnits; monetary fields integers. Create one explicit idempotent fixture seed command, no production auto-seed/drop.

2. Implement GET products and slug route. Parse query primitives explicitly, escape literal search, whitelist sort and filters; validate bounds and cap page size. Query total and items consistently. Test localized names and tie-breaker order.

3. Export getActiveProductsByIds port returning DTOs to Student 5. Keep Mongoose internals private. Document missing IDs excluded and inventory stock included.

4. Implement GET cart and POST persist with authenticated user ownership and atomic expectedRevision condition. Validate distinct IDs/count/quantities against active product stock; map concurrent conflict to409. No body userId accepted.

5. Implement atomic merge with bounded stored mergeIds in same cart document, additive capped quantities and revision increment. Test retry after lost response and concurrent duplicate requests. Initial-cart creation race must be handled with unique userId; never read-modify-save without conflict protection.

6. Implement POST orders with optionalAuth, shared checkout validation, authoritative price/product snapshots and unique requestId/body hash. Same request returns same receipt; different payload conflicts. Validate stock without decrement because orders are simulated.

7. Implement all catalog/http.ts methods with exact routes and query encoding; test optional undefined values not becoming string undefined. Update error UI mappings only in your feature.

8. Add real isolated Mongo tests for filters, ownership, atomic merges/revisions, stock validation and duplicate checkout. Preserve mocked frontend mode for Phase 2 while proving HTTP adapter separately.

## Acceptance scenarios

- [ ] Combining origin+cacao+price+search yields intersection; clear/back/pagination works.
- [ ] Add twice, update, remove, reload guest cart; malformed storage safe.
- [ ] Guest login merges with saved mock cart exactly once; repeat same mergeId no extra quantity.
- [ ] Logout clears authenticated display; delayed response cannot restore it.
- [ ] Mock checkout rejects invalid address/stock; rapid double submit returns one receipt.
- [ ] Raw Mongo operators in URL/body cannot change query/ownership.
- [ ] Two competing persist requests cannot both overwrite same revision.
- [ ] Two same-mergeId requests add guest contents once; initial cart race handled.
- [ ] One user cannot target another cart; no untrusted price accepted.
- [ ] Orders persist exact authoritative totals and retries create one order.

## Required verification

Run npm run check and npm run build, plus owned behavior/schema tests and visual review. Phase2 includes real backend validation tests as well as mock frontend interactions. Phase3 requires real Mongo/API tests; mocks do not count. Phase4 requires actual launch evidence. Run npm run check:ownership -- --member 3 --base development. Shared docs/config outside ownership go as exact handoff proposals to the owner.

## Handoff and stop

Update phase-2-evidence.md, handoff.md and status.json using real results. Set ready_for_review only when owned checks pass; only a reviewer records integrated after the actual PR merge. A blocked check remains blocked. Every PR needs visual review, passing unit tests and at least one peer approval. Stop before commit/push/merge/deploy unless the teammate explicitly asks. Never implement the next phase automatically.

## Demo

Filter products, open product, edit cart, reload guest state, log in and merge, then complete simulated checkout in both languages.
