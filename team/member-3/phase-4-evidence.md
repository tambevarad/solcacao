# Student 3 Phase 4 evidence

State: ready for review, with one post-merge step open (below). Same PR as Phase 3 (D22). Deployed
site: https://solcacao-production.up.railway.app (docs/deployment.md), which deploys `development`.
It therefore ran the code **before** this PR when these checks ran (2026-11-12); the fixes in this
PR reach it only after the merge.

## Implemented requirements and changed paths

1. **Real-HTTP journey repeated on the deployed site.** `tests/member-3/retail-journey.live.spec.ts`
   ran against Railway with no database access (database read-backs off, stale-stock journey skipped).
   It created three synthetic `retail-*@example.test` accounts and one simulated order in the demo
   database.
2. **Images.** Product photos are already compressed WebP (19 files, 682–800 px square,
   13.7–112.7 KiB, 777 KiB in total; shown at 480 CSS px, so right for 2× screens); no re-encoding
   was needed. Catalog cards stay lazy except the first row (`eagerImage`, 3 cards), which is above
   the fold; drawer thumbnails are now lazy with async decoding; the product page's main photo stays
   eager and its thumbnails lazy. Alt text unchanged (cards repeat the linked name, so their photo is
   decorative). Queries: see the index measurements in `phase-3-evidence.md`.
3. **Phone, keyboard, EN/ES, loading/error and console checks** on the deployed site and the local
   build (below). React Hooks/Context, Tailwind and shared Lucide icons only; no new dependency.
4. **Deployment support.** No configuration change needed for the catalog. After merge, Railway
   rebuilds; the seed command must be run once against the demo database to drop the Phase 2 indexes
   (`npm run seed:catalog -- "<public MONGO_URL>/solcacao?authSource=admin"`, per docs/deployment.md
   step 6; Mongoose already builds the new ones at startup). That is Varad's step (he holds the
   secrets); proposal 9 in `handoff.md`.
5. **Docs:** `server/src/features/catalog/README.md` (indexes, cart algorithm, order limits, API
   examples, demo reset, audits, live journeys); presentation segment below.

## Commands actually run (deployed site)

| Command                                                                                 | Result | Output                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/health`                                                                       | pass   | `{"data":{"status":"ok","database":"connected"}}`                                                                                                                                                |
| `GET /api/products?limit=48`, `/es/catalog`, `/api/nope`                                | pass   | 200 with `X-Total-Count: 14`; 200 HTML; 404 JSON                                                                                                                                                 |
| `GET /api/products?origin=peru` vs `origin=Peru`                                        | defect | `peru`: products returned with `X-Total-Count: 0`; `Peru`: 3. The count/page mismatch this PR fixes (locally `peru` now gives 0 items and 0 total)                                               |
| member-3 live spec, `LIVE_BASE_URL=<site>`, `PW_CHANNEL=chrome`                         | fail   | 2 passed, then the merge journey failed: the merge notice is not visible after sign-in on the pre-PR code (only inside the closed drawer); the serial run stopped. This PR fixes it              |
| same, with `LIVE_EXPECT_FLOATING_NOTICE=0` (notices read from the drawer)               | pass   | 10 passed, 1 skipped (stale stock needs the database); no console errors in any journey                                                                                                          |
| scripted audit: `/en,/es` × 375/768/1440 × catalog, filtered catalog, product, checkout | pass   | 24/24: no horizontal overflow, correct `lang`, no console errors (local build: also 24/24)                                                                                                       |
| image loading on `/en/catalog`                                                          | done   | 375 px: 8 of 12 product photos (318 KiB) load before scrolling, all 12 (422 KiB) after; 1440 px: 12 at once. Deployed cards are all `lazy`; this branch: first 3 `eager`, 9 `lazy` (same counts) |

Local Phase 4 checks (typecheck, `npm run check`, build, ownership, mock and live browser runs) are
the ones in `phase-3-evidence.md`; they were run once for both phases.

## Manual demo observations

Desktop/mobile widths; EN/ES; keyboard; happy path; error path. Observed through the automated
Chrome runs above (the agent cannot look at the screen); a human visual review is still required:

- Deployed, 375 px: filters drawer applies Ghana, cart drawer opens from the header with Enter,
  keeps focus inside, Escape returns focus to the cart button; no overflow.
- Deployed, EN/ES: catalog switch keeps `?origin=Peru&sort=priceAsc` and the cart; checkout switch
  keeps the typed address; prices `$9.99` / `9,99 US$`.
- Deployed happy path: filters → product → cart → sign-in merge (eggs capped to 3) → signed-in
  checkout: `POST /api/orders` 201, total equals the API prices, "Demo order — no payment collected",
  stock unchanged, saved cart emptied.
- Deployed error paths: aborted list request shows the error state; lost merge response → Try again
  adds once; conflicting write → 409 and reload.

## Public contract compatibility and peer dependencies

No public contract change (see Phase 3). Deployment is Student 2's; the post-merge index cleanup
needs his database access.

## Known limitations or blocked checks

- **Post-merge, open:** rerun the live spec on Railway **without** `LIVE_EXPECT_FLOATING_NOTICE=0`
  after Railway deploys this PR, and run the seed once to drop the old indexes. Until then the
  deployed site still has the origin count bug and the in-drawer-only notices.
- The stale-stock journey and the order/cart database read-backs were checked locally only (no
  database access to Railway).
- Presentation rehearsal and the peer PR review are human steps and are not claimed here.

## Presentation segment (5 minutes, Reethika: retail catalog and cart)

1. **(0:00–0:45) What the retail side does.** Catalog with filters in the URL, product pages,
   one shared cart drawer, simulated checkout; EN/ES; all through the live API and MongoDB.
2. **(0:45–1:45) Live: browse.** On the deployed site, `/en/catalog`: Collection = Bars, Origin =
   Peru, sort by price. Point at the URL (shareable, survives refresh) and the count from
   `X-Total-Count`. Switch to Español: same filters, Spanish names, USD prices.
3. **(1:45–3:00) Live: cart and the merge edge case.** As a guest add 3 Spring Chocolate Eggs (only
   3 in stock) and a Peru bar. Sign in to an account that already saved 2 eggs. The notice says
   "Spring Chocolate Eggs: 3 instead of 5 (limited by stock)". Explain: the server merges once per
   mergeId, capped by stock, so a retried request after a lost response never adds twice (show the
   test name in `retail-journey.live.spec.ts`).
4. **(3:00–4:00) Live: checkout.** Place the demo order. Show the receipt total equals the database
   prices (the browser never sends a price) and the "no payment collected" label; stock unchanged.
   One stored Order document: status `simulated`, item price snapshots, `userId` from the token.
5. **(4:00–5:00) Engineering.** Measured indexes: 4,500 keys and an in-memory sort per page became
   12–283 keys, and the count/page mismatch for `origin=peru` was fixed; revisioned cart saves
   (409 from another window → reload, never overwrite); 11 live browser journeys and 160 unit and
   database tests.

Backup if the network fails: the same flow on the local build (`npm start` with the seeded local
database) and the recorded results above.

## Review

Proposed commit: see the PR.
Reviewer: requested from tambevarad (Student 2).
PR: see `status.json` once opened.
Integrated commit: (recorded by the reviewer after merge)
