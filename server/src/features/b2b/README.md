# B2B backend

Owner: Student 4. See `team/member-4/context.md` and `team/member-4/handoff.md`. The client side is
in `client/src/features/b2b/README.md`.

## Routes (docs/api.json)

| Route                          | Access | Success                                   | Notes                                                           |
| ------------------------------ | ------ | ----------------------------------------- | --------------------------------------------------------------- |
| `POST /api/b2b/quote`          | b2b    | `201 { data: QuoteReceipt }`              | multipart: `metadata` (JSON string of QuoteInput), `designFile` |
| `GET /api/b2b/quotes/:id`      | b2b    | `200 { data: QuoteReceipt }`              | owner only; another user's id is `404`                          |
| `GET /api/b2b/quotes/:id/file` | b2b    | `200` PDF attachment, `nosniff`, no-store | owner only; disk paths are never exposed                        |

- **Order of checks:** `requireAuth` and `requireRole('b2b')` run before multer reads the upload.
- **Validation:** exactly one `metadata` field and one `designFile`; strict `quoteSchema`
  (contracts/validation.ts); declared MIME `application/pdf`, `.pdf` extension, `%PDF-` signature,
  at most 5 MiB (`413 FILE_TOO_LARGE`, `415 UNSUPPORTED_FILE`, `400 VALIDATION_ERROR`).
- **Storage:** multer keeps the upload in memory. Only after every check passes is it written to
  `<UPLOAD_DIR>/b2b/<uuid>.pdf` (mode 0600). The directory is never served statically.
- **Idempotency:** unique `(userId, requestId)`. The same body (canonical metadata + file SHA-256)
  returns the original receipt with no new file or notification. A different body returns
  `409 IDEMPOTENCY_CONFLICT`. Concurrent duplicates race on the unique index and the loser deletes
  its file.
- **Notification:** the request is saved first, then `notifyQuote` runs. `failed` or a thrown
  error is recorded and reported in the receipt; the saved request is kept.
- **Database:** uses the shared mongoose connection. If it is not connected the routes return
  `503 SERVICE_UNAVAILABLE` instead of buffering.

## Dependencies (injected through `createB2bRouter`)

- `requireAuth` / `requireRole('b2b')` from Student 1 (`server/src/shared/auth.ts`), wired into the
  exported `b2bRouter` during Phase 2 integration: `401` without a valid token, `403` for retail.
- `notifyQuote` from Student 5 (`server/src/features/support/notifications.ts`), also wired; it
  reports `failed` without throwing when SMTP is unavailable, and the receipt says so.
- `connectDb` and index initialization from Student 1, called at startup in `server/src/index.ts`.

Tests use test doubles for these ports (`tests/member-4/quote-test-app.ts`). Persistence tests run
against a real MongoDB when `TEST_MONGODB_URI` is set, for example with `npm run services`:

```sh
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test npx vitest run tests/member-4
```

## Private files in production

- **Where they live:** `UPLOAD_DIR` must be on persistent disk; on Railway it is a volume mounted at
  `/data`, with `UPLOAD_DIR=/data/uploads` (docs/deployment.md).
- **Not public:** files sit in `<UPLOAD_DIR>/b2b` under generated names, with the folder at mode
  0700 and each file at 0600.
  - The production app serves the built client from `CLIENT_DIST_DIR`. Student 2's
    `createClientRouter` refuses to start if that root overlaps `UPLOAD_DIR`, and nothing serves
    `UPLOAD_DIR` statically.
  - `tests/member-4/private-storage.test.ts` checks this against the real `server/src/app.ts`, and
    the Phase 3 evidence records the same probes against the running server.
- **After a restart:** a new process reads the same directory, so a saved file still downloads
  (`quote-persistence.test.ts`, plus a real restart in the Phase 3 evidence).

## Database triggers

None. `docs/data-model.md` specifies no triggers, and none were added. The equivalent guarantees
come from the service and indexes:

- the unique `(userId, requestId)` index makes a retry or a concurrent duplicate one record;
- the file is written before the record is created, and it is deleted if the save fails;
- notification runs only after the save, and its result is stored on the record.

## Known limits

- Files are on the app's local disk. A host without a persistent volume loses them on redeploy.
  More than one app instance would need shared storage (object storage would be a reviewed change).
- Staff cannot retrieve quote files in the app; the email carries only the reference, company and
  contact (`docs/contracts.md`). The owner downloads through the API.
- The quote route has no rate limit of its own. It needs a signed-in business account, and
  registration and sign-in are rate-limited by Student 1.
