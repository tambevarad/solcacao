# Student 3 Phase 2

## Outcome

Complete your responsive React interaction flow using the typed mock API; no live backend required.

## Entry conditions

Auth/locale/cart public ports exist as stubs. Student 2 supplies shell; do not edit shell to show your cart.

Read your context.md and current status/evidence first. If previous phase is not integrated, explain the dependency; do not silently skip it. Root context.md and docs/contracts.md remain binding.

## Ordered implementation steps

1. Create a small explicitly fictional product fixture set owned by catalog, with deterministic 24-hex IDs, both languages, category/origin/cacao range/price variation and at least one inactive/out-of-stock case. Include simple original placeholder images, not Fran’s assets.

2. Implement catalog/mock.ts list/get with exact query semantics, stable pagination/sorting and predictable errors. UI calls api.catalog; expose no fixtures directly to Student 4/5.

3. Build CatalogPage with URL-driven search/filter/sort/page controls and responsive grid. Reset page to 1 when filters change; back/forward restores them. Empty results and API failure are different states. Slider and numeric boundaries agree.

4. Build ProductPage from canonical slug with gallery, ingredient/allergen/care display and add-to-cart controls. Handle nonexistent/inactive slug and stock zero. Keep language selection independent of slug.

5. Implement CartProvider/reducer and CartDrawer via public.tsx stable interface. Add/update/remove/clear, subtotal, count=sum quantities, empty/loading/error states and guest localStorage parsing. Share one instance mounted in main.tsx; no second cart in header or checkout.

6. Implement mock persisted carts, merge and revision conflict behavior consistent with docs/contracts.md. Observe useAuth user transitions; merge only once per guest version, preserve guest state on failure and ignore stale account responses. Mock state can use in-memory maps; never persist auth token/password.

7. Build simulated CheckoutPage and OrderConfirmationPage with validated email/address, review totals, requestId duplicate protection and explicit no-payment copy. In Phase 2 receipt is simulated in memory, not claimed saved to Mongo. Confirmation reload handles absent state.

8. Write all catalog.* EN/ES messages; maintain cart across language toggles. Publish cart exports/fixture API for homepage and sampler owners and document stock adjustment/conflict UX.

## Acceptance scenarios

- [ ] Combining origin+cacao+price+search yields intersection; clear/back/pagination works.
- [ ] Add twice, update, remove, reload guest cart; malformed storage safe.
- [ ] Guest login merges with saved mock cart exactly once; repeat same mergeId no extra quantity.
- [ ] Logout clears authenticated display; delayed response cannot restore it.
- [ ] Mock checkout rejects invalid address/stock; rapid double submit returns one receipt.

## Verification and handoff

1. Run `npm run typecheck`, targeted tests under `tests/member-3`, `npm run check`, and `npm run build`.
2. Run `npm run check:ownership -- --member 3 --base development` and resolve accidental edits. Shared approved changes still require the owner's PR.
3. Run manual desktop/mobile, EN/ES and keyboard checks relevant to the steps above. Backend phase also requires real isolated Mongo API checks; mocks alone do not count.
4. Record commands, exact pass/fail counts, manual observations, dependency blockers, public API compatibility and proposed commit in `phase-2-evidence.md`. Screenshots must use synthetic data, no secrets.
5. Update status.json and handoff.md. Never mark a skipped test passed. Stop before commit/push/merge unless explicitly requested. Do not begin the next phase.

## Demo walkthrough

Filter products, open product, edit cart, reload guest state, log in and merge, then complete simulated checkout in both languages.

## Stop boundary

Do not implement Mongoose models, production JWT/SMTP/file storage or live backend routes in this phase. All mock behavior must be disclosed.
