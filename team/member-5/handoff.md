# Student 5 handoff

Current phase: Phase 2 implementation delivered locally; review/integration evidence remains incomplete.
Date: 2026-10-27. Branch: `daniel-phase2`, created from `origin/development` at `3873f6f`.
Daniel explicitly requested this branch; the unchanged roster says `daniel-support`. The packet
reports a branch mismatch, which is an explicit user-authorized exception, not a bypass of checks.
Remote `origin/daniel-phase2` had no commits ahead of development; no remote work was overwritten.
The local branch now tracks that remote. No commit, push, PR or deployment was performed.
Phase 1 remains not_started; coordinator decision D21 authorizes starting Phase 2.

## Frontend completion update (2026-10-27)

Subsequent user-requested cleanup removed added explanatory code comments. The functional
Vitest jsdom directive remains. Typecheck, diff whitespace and ownership checks passed;
no executable behavior was changed or additional phase work started.

Daniel authorized finishing the remaining frontend items after the Markdown update. Story and
Care now show complete EN/ES copy based on the supplied DOCX's catalog, business and support
journeys. The pages have two readable information sections, localized metadata and localized
catalog/wholesale/sampler/contact links. Care routes product-specific storage/handling questions
to support rather than inventing food safety instructions. Existing backend code was preserved.

Daniel confirmed there is no WhatsApp business number yet and the intended destination is a US
number. The link remains correctly hidden until a real WhatsApp-enabled destination is provided.
`client/src/features/support/README.md` documents country code 1 plus ten digits, environment
configuration, Vite restart and the manual check. No number/account was fabricated or registered.
The configured-link test uses a synthetic number without opening WhatsApp or sending messages.

The student demo, configured-destination check and human peer review remain outstanding. Existing
backend/teammate test limitations below are retained as historical integration notes; they do
not authorize more backend work under the current frontend-only instruction.

Current verification: typecheck/build passed, focused page/adapter/dictionary tests 34 passed,
support browser tests 5 passed across EN/ES and 375/768/1440 px. Updated mobile Spanish content
screenshot inspected. Build retains the shared >500 kB JS advisory. No backend tests or the
previously failing whole-project check were rerun solely for this frontend content change.

Proposed current commit: `feat(support): finish phase 2 informational pages and demo checklist`.

## Existing implementation handoff

Public exports delivered:

Current assessment scope clarification (2026-10-27): Daniel requests the Member 5 frontend-only
Phase 2 checkpoint (15%). `phase-2.md` now lists the DOCX features, current implementation,
remaining content/WhatsApp tasks and required demo scenarios. `checklist.md` links to it. Existing
code and broader blueprint notes are retained. This documentation update does not add backend
work, mark the student demo complete, or remove the previously recorded integration limitations.

- Existing ContactPage, FeedbackPage, SamplerPage, StoryPage and CarePage default exports, same routes.
- `createMockSupport(http)` and `createHttpSupport(http)`: unchanged `SupportApi` signatures.
- `supportRouter`: already mounted at `/api`; implements POST `/inquiries`.
- `notifyQuote(input: {quoteId:string;companyName:string;contactEmail:string;locale:Locale}): Promise<'sent'|'failed'>` from `server/src/features/support/notifications.ts` for Student 4.
- Testable `createNotifications({env,transport})`, `createInquiryService({store,products,notify})`,
  and `createSupportRouter({submit,isDatabaseReady,rateLimitMax})`; these are owned test seams,
  not extra wire fields. `NotificationTransport.sendMail` resolves `{accepted:string[]}`.
- Existing shared dictionaries automatically assemble the new matching support EN/ES keys.

Behavior: local validation, focusable errors, retained entries, pending lock, idempotent retries,
six-piece selection and summary, active products only, no sampler price/cart/order, disclosed mock
receipts, optional generic WhatsApp link, stock photo disclosures and pending-content sections.
Sampler products come only from `api.catalog.list`; no duplicate catalog or peer-internal imports.
The server independently rechecks active product IDs through the published catalog service.
Shared inquiry schema is supplemented in owned rules with case-insensitive unique product IDs.

Persistence: unique requestId/hash and immutable product name snapshots, then one SMTP attempt.
Identical retries return the saved receipt; changed input returns 409. A mail outage preserves
the enquiry with failed status. A crash or status-write outage can leave pending; retries do not
send again. Operator inspection/retry is outside this phase; there is no hidden background job.

Required peer exports/PRs:

- Student 3's published catalog client/service ports are present and consumed without changes.
- Student 1's DB connection/startup port is not present in this checkout. Production startup
  must connect before listening and initialize the Inquiry unique index. The router truthfully
  returns 503 while the default Mongoose connection is disconnected.
- Student 4 should consume the notification port after saving a quote, persist the result and
  never attach design files. The module catches SMTP failures; synthetic injected and actual
  loopback SMTP tests pass. No real team mailbox was contacted.

Shared change proposals:

### 1. Student 4: update the obsolete inquiry-stub assertion

`tests/member-4/quote-api.test.ts:20` still expects 404 from POST `/api/inquiries` with `{}`.
The route now exists, so empty input correctly returns 400. In the existing authentication test,
replace only that assertion with:

```ts
const inquiry = await request(realApp).post('/api/inquiries').send({});
expect(inquiry.status).toBe(400);
expect(inquiry.body.error.code).toBe('VALIDATION_ERROR');
```

Keep both B2B 401 assertions unchanged. No DTO/schema/HTTP signature change; this is an outdated
cross-feature test expectation. It is the remaining failure in `npm run check`, not a failing
authorization behavior. Student 4 integrates this in its reviewed PR; its files were not edited.

### 2. Student 1: database startup and global parser error envelopes

In the owned server bootstrap, implement the existing `connectDb(uri:string):Promise<void>` port,
await it before `app.listen`, import `InquiryModel` from `./features/support/model.js` and await
`InquiryModel.init()` before accepting requests. Mongo credentials remain environment-owned;
no secrets or alternate DB connections were added. No API signature change.

The shared app's global JSON parser runs before this router. Its malformed JSON or >100 KiB
errors therefore need the owner's global handler to return the contract envelope: 400/413 with
`code: 'VALIDATION_ERROR'`, a safe fixed message and no raw exception. The owned router handles
its own parser and post-parse 16 KiB limit, but cannot fix earlier app-level errors. Update only
the 400/413 branches in `server/src/app.ts`; preserve 500 sanitization and other owners' errors.
Add global malformed/oversized JSON tests in Student 1's area. No request/response DTO change.

### 3. Student 2 / schema coordinator: shared documentation and content

For README mail setup, add this text through the owner's PR:

> Support uses SMTP_HOST, SMTP_PORT, SMTP_SECURE, optional paired SMTP_USER/SMTP_PASS,
> MAIL_FROM and SUPPORT_EMAIL. Development SMTP is limited to the local Mailpit sink.
> Run npm run services and inspect http://localhost:8025. Notification failure preserves the
> saved inquiry and returns notificationStatus=failed; pending requires operator inspection.
> No automatic email retry occurs on an idempotent resubmission. See server/src/features/support/README.md.

Schema documentation discrepancy: docs/data-model.md and the Phase 2 model plan describe flat
InquiryInput fields, while docs/phase1/database-schema-design.md section 2.9 calls them `input`.
The implementation follows the flat fields in docs/data-model.md: `name`, `email`, `category`,
`message`, `locale`, plus requestId/hash, sampler snapshots and statuses. Proposed exact section
2.9 change: replace its `input` row with rows for those five scalar fields and their shared inquiry
validation limits. Public InquiryInput/InquiryReceipt, API route, and contracts remain unchanged;
there is no existing persisted support implementation to migrate. Coordinator/schema owner review
is required; shared docs were not edited.

No new assets were created. Existing `photos.homeStory` and `photos.productDarkShards` come from
the approved shared library; their source register remains authoritative. Needed content: approved
brand story, sourcing/history facts, original process photos, product care/ingredient/allergen text,
and a verified optional WhatsApp number. Supplied-content slots are explicit; no invented claims.

Known limitations and next step:

- `npm run check` is red until proposal 1 lands. All Member 5 behavior tests pass (24 passed,
  1 explicitly skipped Mongo test). Typecheck, build and ownership pass.
- No TEST_MONGODB_URI or Docker/mongod was available. `npm run services` fails with the documented
  Docker installation/startup message. The isolated Mongo test is written but not passing evidence.
- To run it after services are configured:
  `TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test_member5 npx vitest run tests/member-5/mongo.test.ts`.
  It refuses non-test DB names and only deletes its own synthetic requestId. No real Mongo
  persistence or combined Mongo+SMTP stack success is claimed.
- Mail is verified with a fake transport and actual Nodemailer against a loopback-only ephemeral
  SMTP sink. The Mailpit UI itself is unverified. HTTP adapter round trip uses Express and injected
  persistence; frontend stays in mock mode, with no HTTP-to-mock fallback.
- Browser tooling was initially absent; Chromium and its Ubuntu libraries were installed with
  approval. Browser automation covers the owned EN/ES pages and keyboard flow; human peer visual
  review and academic demo are still outstanding.
- Final owned browser suite: 5 passed, including six-piece submission against the integrated mock
  catalog. Shared browser suite: all 11 passed. Final ownership check: all 34 changed files are owned.
- Build succeeds with the shared application's >500 kB JS bundle advisory; no owner config changes.
- Full detail and actual command results are in phase-2-evidence.md. Status stays in_progress
  pending Mongo evidence and integration review; no future phase was started.

Proposed commit: `feat(support): implement phase 2 enquiry flows`.
