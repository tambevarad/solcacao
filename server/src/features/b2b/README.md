# B2B backend

Owner: Student 4. See `team/member-4/context.md` and the Phase 2 handoff in `team/member-4/handoff.md`.

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
