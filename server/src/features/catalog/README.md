# Catalog backend

Owner: Student 3. See `team/member-3/context.md` and the Phase 2 handoff in `team/member-3/handoff.md`.

## Routes (docs/api.json)

| Route                     | Access        | Success                      | Notes                                                                            |
| ------------------------- | ------------- | ---------------------------- | -------------------------------------------------------------------------------- |
| `GET /api/products`       | public        | `200` raw `Product[]`        | `X-Page`, `X-Limit`, `X-Total-Count`, `X-Total-Pages` headers (wire exception)   |
| `GET /api/products/:slug` | public        | `200 { data: Product }`      | active products only; missing, inactive or malformed slug → `404`                |
| `GET /api/cart`           | user          | `200 { data: Cart }`         | empty `{ items: [], revision: 0 }` when nothing is saved                         |
| `POST /api/cart/persist`  | user          | `200 { data: Cart }`         | raw `CartLine[]` body; `If-Match: "<revision>"`; mismatch → `409 CART_CONFLICT`  |
| `POST /api/cart/merge`    | user          | `200 { data: Cart }`         | `{ items, mergeId }`; additive, capped, idempotent per mergeId                   |
| `POST /api/orders`        | optional-user | `201 { data: OrderReceipt }` | simulated; database prices; requestId idempotency; no stock deduction or payment |

- **Query parsing.** Only the contract keys are accepted, each once, as plain strings; numbers must
  be base-10 integers. Bracketed keys (`origin[$ne]`), repeated keys, unknown keys, `cacaoPct` with
  `cacaoMin/cacaoMax`, reversed ranges and `limit > 48` are `400 VALIDATION_ERROR`. The Mongo filter
  is built from the parsed primitives only (`service.ts › productFilter`), search is an escaped
  literal case-insensitive regex on the selected locale's `name`/`description`, and the count and the
  page use the same filter. Sort: localized name (collation) or price, always then `_id`.
- **Shared rules.** Query, cart-line, merge and checkout schemas live in
  `client/src/features/catalog/rules.ts` and are imported by both this router and the Phase 2 mock
  adapter, so the two cannot drift (same pattern as the shell dictionaries).
- **Cart concurrency.** Persist is one conditional `findOneAndUpdate({ userId, revision })` with
  `$inc: { revision: 1 }`; a new cart (revision 0) races on the unique `userId` index. Merge reads the
  cart, computes the capped additive result and writes items, revision and the mergeId in one
  conditional update (`revision` unchanged and `mergeIds: { $ne: mergeId }`), retrying on a lost
  race. The latest **100** mergeIds are kept (`$slice: -100`): a retry older than 100 later merges
  would apply again — that is the documented retry horizon.
- **Orders.** `requestId` is unique. A retry must match the stored SHA-256 of the normalized body
  (email lowercased/trimmed, address, lines) and the same owner (user id or guest) to receive the
  original receipt; anything else is `409 IDEMPOTENCY_CONFLICT`. Items store name/price snapshots.
  Stock is checked (`409 OUT_OF_STOCK` with per-line `fieldErrors`) but never decremented (D03/D04).
- **Database.** Uses the shared mongoose connection. If it is not connected the routes return
  `503 SERVICE_UNAVAILABLE` (after authentication and validation) instead of buffering.
- **Port for Student 5.** `getActiveProductsByIds(ids)` in `service.ts`: DTOs with inventory stock,
  deduplicated in first-seen order; malformed, missing and inactive ids are excluded.

## Fixture seed (explicit, idempotent)

Fictional products from `client/src/features/catalog/fixtures.ts`, upserted by fixed ObjectId with
their inventory. Never deletes, never runs at startup, refuses `NODE_ENV=production`:

```sh
npx tsx server/src/features/catalog/seed.ts                     # MONGODB_URI from .env
npx tsx server/src/features/catalog/seed.ts mongodb://127.0.0.1:27017/solcacao
```

## Dependencies still pending (injected through `createCatalogRouter`)

- `requireAuth` / `optionalAuth` from Student 1 (`server/src/shared/auth.ts`). Until then the
  exported `catalogRouter` uses `authenticationPending` (every cart route → `401`) and
  `guestOnlyPending` (checkout accepts guests; any `Authorization` header → `401`, never a silent
  guest downgrade). Mock tokens are never accepted.
- `connectDb` from Student 1, called at startup in `server/src/index.ts`.
- CORS `exposedHeaders` for the four `X-*` pagination headers in `server/src/app.ts` (Student 1) for
  cross-origin deployments; same-origin and the Vite proxy work without it.

Tests use test doubles for these ports (`tests/member-3/catalog-test-app.ts`). Persistence tests run
against a real MongoDB when `TEST_MONGODB_URI` is set, for example with `npm run services`:

```sh
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test_member3 npx vitest run tests/member-3
```
