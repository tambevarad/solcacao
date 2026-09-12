# Student 4 Phase 3

## Outcome

Complete your validated Express/Mongoose subsystem and matching HTTP adapter with real persistence tests.

## Entry conditions

Student 1 auth/database ports ready. Student 5 notifyQuote port may land later; inject a test notification dependency and record blocked real bridge integration.

Read your context.md and current status/evidence first. If previous phase is not integrated, explain the dependency; do not silently skip it. Root context.md and docs/contracts.md remain binding.

## Ordered implementation steps

1. Implement B2BRequest model with own-user index, idempotency key/hash and private file metadata. Never store File objects or public disk URLs.

2. Implement POST /b2b/quote with requireAuth+requireRole before multer. Accept metadata JSON string and designFile only. Validate quantity/enums/company/email/locale/requestId using shared quote schema; reject malformed JSON and unexpected fields.

3. Implement private local storage with generated filenames, .pdf/MIME/signature verification and 5MiB limit. Delete partial/temp files on validation, DB, duplicate submission and middleware errors. Directory is not served statically.

4. Persist request before calling notifyQuote from Student 5. SMTP failure returns saved request receipt with failed status, not a generic failure that encourages duplicate manufacturing requests. Do not send file contents or invent recipient routes.

5. Handle duplicate requestId atomically with unique index; identical canonical metadata+digest yields original receipt without duplicate file/email; differing body returns409. Clean new temporary file in either duplicate path.

6. Implement own quote receipt and PDF attachment GET routes. Use JWT subject ownership filter; another business gets404. Reject guessed/malformed IDs; set attachment filename safely, nosniff and application/pdf.

7. Implement b2b/http.ts FormData exactly: metadata JSON and designFile File. No manually supplied multipart Content-Type. Verify DTO receipt and upload error mapping.

8. Write tests with synthetic minimal PDFs and temp storage, fake SMTP for unit tests, real Mongo for persistence. Cover cleanup and ownership; never use real corporate confidential files in fixtures.

## Acceptance scenarios

- [ ] Missing/retail token rejected before storing a file.
- [ ] PDF MIME spoof/signature mismatch/oversized upload rejected and temp files removed.
- [ ] Two identical concurrent submissions produce one request/file/notification attempt.
- [ ] Other B2B user cannot retrieve receipt or file.
- [ ] SMTP failure preserves saved request; response accurately reports failure.

## Verification and handoff

1. Run `npm run typecheck`, targeted tests under `tests/member-4`, `npm run check`, and `npm run build`.
2. Run `npm run check:ownership -- --member 4 --base development` and resolve accidental edits. Shared approved changes still require the owner's PR.
3. Run manual desktop/mobile, EN/ES and keyboard checks relevant to the steps above. Backend phase also requires real isolated Mongo API checks; mocks alone do not count.
4. Record commands, exact pass/fail counts, manual observations, dependency blockers, public API compatibility and proposed commit in `phase-3-evidence.md`. Screenshots must use synthetic data, no secrets.
5. Update status.json and handoff.md. Never mark a skipped test passed. Stop before commit/push/merge unless explicitly requested. Do not begin the next phase.

## Demo walkthrough

Submit multipart request, show DB record and private file, demonstrate invalid upload and forbidden file access.

## Stop boundary

Do not redesign completed UI, change DTOs unilaterally or claim final integration/deployment. Supply working API evidence and adapter.
