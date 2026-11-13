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
  page use the same filter. `origin` is an exact, case-sensitive match (an anchored regex, which
  ignores collation, so the name sort's case-insensitive collation cannot widen it). Sort: localized
  name (locale collation, strength 1) or price (no collation), then `_id`; priceDesc is the exact
  reverse of priceAsc (`_id` descending on ties).
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

## Indexes (Phase 3, measured first)

Measured with `explain('executionStats')` on a synthetic 5,000-product catalog
(`npx tsx tests/member-3/index-bench.mts`, numbers in `team/member-3/phase-3-evidence.md`). The
Phase 2 indexes could not serve any list query: every query ran with a collation, so simple-collation
indexes could not bound `category`/`origin`, and none ended in `_id`, so each page sorted all 4,500
active products in memory (slower than no index). Now:

| Index (products)                                | Serves                                   |
| ----------------------------------------------- | ---------------------------------------- |
| `active_name_en` / `active_name_es` (collation) | name sort in that locale, with filters   |
| `active_price` `{active, priceCents, _id}`      | price sorts, price ranges, unfiltered    |
| `active_category_price`                         | category filter + price sort             |
| `active_origin_price`                           | origin filter + price sort, origin count |

Every measured query now reads 12–283 keys (was 4,500) with no in-memory `SORT` stage;
`persistence.test.ts` guards the winning plans. Mongoose builds declared indexes at startup; the
seed command (below) also runs `syncIndexes()` for products, which drops the old Phase 2 indexes.

## Cart algorithm (client `CartProvider`, server above)

- **Guest:** lines in `localStorage` (`solcacao.guestCart.v1`, `{ items, mergeId }`), validated on
  read; the `mergeId` (`crypto.randomUUID`) rotates on every edit and is kept for retries.
- **Sign-in:** load the saved cart, then `merge(guestItems, mergeId)` once. The server sums matching
  lines capped by `min(99, stock)` and drops unavailable ones; the UI replaces its state with the
  result, clears guest storage **only after success**, and lists reduced lines ("3 instead of 5").
  A failed or lost merge keeps the guest cart and offers Try again with the **same** mergeId, which
  the server recognises, so the lines are added exactly once.
- **Signed in:** each edit applies locally, then one save at a time sends the latest lines with
  `If-Match: "<revision>"`. `409 CART_CONFLICT` (another window), `OUT_OF_STOCK` or an unavailable
  line refetches the saved cart and asks the shopper to repeat the change; a lost or failed save rolls
  back to the lines the server last confirmed. Catalog pages learn the outcome (`addLine`) and keep
  the chosen amount when nothing was saved; the public `useCart().add` is unchanged.
- **Sessions:** every async step carries a session generation; responses after sign-out or an
  account switch are ignored. Sign-out clears the private cart (it is never copied to the device);
  a full reload starts signed out and the saved cart returns after sign-in.
- While the drawer is closed, merge results, conflict reloads and load failures float over the page
  (`CartDrawer`), so they are seen wherever the shopper is.

## Simulated orders: limitations

Orders are a demonstration (D03/D04): no payment, tax, shipping or stock deduction, and no order
history endpoint. Stock is only checked at submission, so two shoppers can both "buy" the last unit.
The receipt is passed in route state; a reload of the confirmation in a new tab shows a link back to
the catalog, not an invented order. Guest orders cannot be looked up by id.

## API examples (local, after the seed)

```sh
curl -i 'http://127.0.0.1:4000/api/products?origin=Peru&sort=priceAsc&limit=2'
# 200, raw array; X-Page: 1, X-Limit: 2, X-Total-Count: 3, X-Total-Pages: 2
curl 'http://127.0.0.1:4000/api/products?origin%5B%24ne%5D=x'
# 400 {"error":{"code":"VALIDATION_ERROR",...,"fieldErrors":{"origin[$ne]":"Unexpected field"}}}
curl 'http://127.0.0.1:4000/api/products/foil-heart-duo'      # inactive → 404 NOT_FOUND
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4000/api/cart
curl -X POST -H "Authorization: Bearer $TOKEN" -H 'If-Match: "0"' -H 'Content-Type: application/json' \
  -d '[{"productId":"5c0ca0000000000000000002","quantity":2}]' http://127.0.0.1:4000/api/cart/persist
curl -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"5c0ca0000000000000000002","quantity":1}],"mergeId":"<uuid>"}' \
  http://127.0.0.1:4000/api/cart/merge                        # same mergeId again → no change
curl -X POST -H 'Content-Type: application/json' -d '{"items":[{"productId":"5c0ca0000000000000000002","quantity":1}],
  "email":"guest@example.test","requestId":"<uuid>","address":{"recipient":"Guest","line1":"1 Cacao Lane",
  "city":"Austin","region":"TX","postalCode":"78701","country":"US"}}' http://127.0.0.1:4000/api/orders
# 201 {"data":{"id":"…","status":"simulated","totalCents":999,"currency":"USD",…}}
```

## Demo reset

There is no reset endpoint (by design). To restore the demo catalog, run the seed against the demo
database only: it upserts the fixtures and their stock, rebuilds indexes, and deletes nothing. To
also clear demo carts and orders, delete documents from `carts` and `orders` deliberately in that
database (for example in `mongosh`); nothing in the app does this. For Railway, follow
`docs/deployment.md` step 6 (temporary public TCP proxy, then remove it).

## Trigger and security audit (Phase 3)

- **Triggers:** none are specified (docs/data-model.md), and none were added. The equivalent
  guarantees are atomic conditional writes in `service.ts`: revisioned persist, merge marker plus
  revision in one update, unique `requestId` with hash check, unique cart per user.
- **Security sweep:** strict query/body parsing (unknown, bracketed and repeated keys rejected),
  no client object reaches a Mongo filter, regexes escaped, prices and totals only from the database,
  user id only from the verified token, an invalid token on checkout is `401` (never a guest
  downgrade), no stack traces in errors, no PII or token in guest storage, no payment data stored.
- **ES/EN:** catalog keys are identical in `locales/en.json` and `es.json` (checked by
  `npm run check:structure`); product text stays in the Product documents.

## Fixture seed (explicit, idempotent)

Fictional products from `client/src/features/catalog/fixtures.ts`, upserted by fixed ObjectId with
their inventory, plus `syncIndexes()` for products. Never deletes documents, never runs at startup,
refuses `NODE_ENV=production`:

```sh
npm run seed:catalog                                            # MONGODB_URI from .env
npm run seed:catalog -- mongodb://127.0.0.1:27017/solcacao
```

## Live browser journeys (Phase 3/4)

`tests/member-3/retail-journey.live.spec.ts` runs against the compiled API serving the built client
(see `tests/member-3/playwright.config.ts`). Locally it also reads MongoDB (`LIVE_MONGODB_URI`, the
same database the API uses). Against the deployed site leave that unset: database read-backs and the
stale-stock journey are skipped.

## Dependencies (injected through `createCatalogRouter`)

- `requireAuth` / `optionalAuth` from Student 1 (`server/src/shared/auth.ts`), wired into the
  exported `catalogRouter` during Phase 2 integration: cart routes need a verified bearer token;
  checkout accepts guests, and a supplied but invalid token is `401`, never a silent guest downgrade.
- `connectDb` and index initialization from Student 1, called at startup in `server/src/index.ts`.
- CORS `exposedHeaders` for the four `X-*` pagination headers, set in `server/src/app.ts`.

Tests use test doubles for these ports (`tests/member-3/catalog-test-app.ts`). Persistence tests run
against a real MongoDB when `TEST_MONGODB_URI` is set, for example with `npm run services`:

```sh
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test_member3 npx vitest run tests/member-3
```
