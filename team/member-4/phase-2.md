# Student 4 Phase 2 — Core Development

Blueprint execution window: Weeks 3–4. Academic checkpoint mapping: docs/roadmap.md. Read context.md, docs/contracts.md, docs/api.json and your member context first. Preserve owner boundaries.

## Entry conditions

Your prior phase must be integrated and current development synchronized. Use published peer ports; report unavailable dependencies without taking over their code.

## Ordered implementation steps

### Frontend track

1. Build HomePage using design.md section order with original placeholder image slots, hero slides and seasonal entry points. Controls accessible, reduced motion respected; link categories through canonical catalog query values.

2. Build WholesalePage explaining custom molds/branding, packaging and white-label services with original example placeholders. One clear start-customization action. Keep real business claims absent until supplied.

3. Implement a reducer/state machine for exactly four wizard steps per contract; maintain one QuoteInput draft and File state. Back/next preserves data; validation gates only current step then full validation at review. Step 4 shows all selected options and sanitized filename.

4. Add visual cacao and packaging choices, quantity input min50/max100000, business/contact fields and PDF upload control max5MiB. Client prevalidation assists user but is not claimed security. File can be replaced/removed before submission.

5. Integrate auth public access wrapper: guest -> safe login return, retail -> business explanation, b2b -> wizard. If Student 1 wrapper pending, test controlled user states through provider harness and list wiring blocker; do not implement auth yourself.

6. Implement b2b/mock.ts submit with deterministic receipt, injected success/failure states and requestId reuse on retry. Keep draft/file on error, disable pending submission, clear only after confirmed success. Mark demo requests as mock in evidence/UI development notice.

7. Add b2b.* translations and verify switching language keeps current step, values and in-memory file. Page reload explicitly requires reselecting file. Do not write corporate file data to browser storage.

8. Publish UI routes/guard request and notification field requirements in handoff to Students 1/2/5.

### Backend track

1. Implement B2BRequest model with own-user index, idempotency key/hash and private file metadata. Never store File objects or public disk URLs.

2. Implement POST /b2b/quote with requireAuth+requireRole before multer. Accept metadata JSON string and designFile only. Validate quantity/enums/company/email/locale/requestId using shared quote schema; reject malformed JSON and unexpected fields.

3. Implement private local storage with generated filenames, .pdf/MIME/signature verification and 5MiB limit. Delete partial/temp files on validation, DB, duplicate submission and middleware errors. Directory is not served statically.

4. Persist request before calling notifyQuote from Student 5. SMTP failure returns saved request receipt with failed status, not a generic failure that encourages duplicate manufacturing requests. Do not send file contents or invent recipient routes.

5. Handle duplicate requestId atomically with unique index; identical canonical metadata+digest yields original receipt without duplicate file/email; differing body returns409. Clean new temporary file in either duplicate path.

6. Implement own quote receipt and PDF attachment GET routes. Use JWT subject ownership filter; another business gets404. Reject guessed/malformed IDs; set attachment filename safely, nosniff and application/pdf.

7. Implement b2b/http.ts FormData exactly: metadata JSON and designFile File. No manually supplied multipart Content-Type. Verify DTO receipt and upload error mapping.

8. Write tests with synthetic minimal PDFs and temp storage, fake SMTP for unit tests, real Mongo for persistence. Cover cleanup and ownership; never use real corporate confidential files in fixtures.

## Acceptance scenarios

- [ ] Cannot skip required step values; back/edit/review consistent.
- [ ] Wrong type or >5MiB upload is rejected; replacing file updates summary.
- [ ] Language switch at step3 preserves file/quantity/packaging.
- [ ] Failed submit keeps all draft data; retry uses same requestId until edits create a new submission.
- [ ] Retail cannot reach submission UI; b2b can.
- [ ] Missing/retail token rejected before storing a file.
- [ ] PDF MIME spoof/signature mismatch/oversized upload rejected and temp files removed.
- [ ] Two identical concurrent submissions produce one request/file/notification attempt.
- [ ] Other B2B user cannot retrieve receipt or file.
- [ ] SMTP failure preserves saved request; response accurately reports failure.

## Required verification

Run npm run check and npm run build, plus owned behavior/schema tests and visual review. Phase2 includes real backend validation tests as well as mock frontend interactions. Phase3 requires real Mongo/API tests; mocks do not count. Phase4 requires actual launch evidence. Run npm run check:ownership -- --member 4 --base development. Shared docs/config outside ownership go as exact handoff proposals to the owner.

## Handoff and stop

Update phase-2-evidence.md, handoff.md and status.json using real results. Set ready_for_review only when owned checks pass; only a reviewer records integrated after the actual PR merge. A blocked check remains blocked. Every PR needs visual review, passing unit tests and at least one peer approval. Stop before commit/push/merge/deploy unless the teammate explicitly asks. Never implement the next phase automatically.

## Demo

Show homepage, wholesale service entry, business login, four steps with sample PDF, error recovery and mock receipt.
