# Support backend

Owner: Student 5. Phase 2 implements `POST /api/inquiries` and the notification bridge.

Phase 3 adds server-resolved sampler selections to localized email notifications. IDs, piece
counts and names come from the same active catalog lookup used for database snapshots. Browser
names/descriptions are rejected by the strict request schema. The email explicitly says the
sampler is an inquiry, with no order, price or delivery confirmation.

The router is already mounted by the shared app. All categories use the same strict input and
`{data: InquiryReceipt}` response. Validation runs before the DB readiness check. The router
limits public submissions to 20 per IP per 15 minutes and bounds JSON to 16 KiB (the shared
app also has a 100 KiB parser). No client recipient, subject, sender or price is accepted.

`createInquiryService` persists an inquiry with a unique requestId and canonical SHA-256 hash
before notifying. Same normalized input returns the original receipt; changed input returns 409.
The unique index arbitrates concurrent retries: only the creator attempts notification. Active
sampler products come from Student 3's `getActiveProductsByIds`; names are saved as snapshots.
No product price or cart/order is created. Ensure `InquiryModel.init()` completes during the
database startup/index workflow before accepting traffic (shared bootstrap belongs to Student 1).

Mail failure returns `received` with notificationStatus `failed`; the saved inquiry survives.
If the notification status write itself fails, the receipt is `pending`, which requires operator
inspection. Retries never automatically send mail again. A crash after save can also leave
`pending`; there is no background delivery job or operational retry UI in this phase.

## SMTP configuration

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, optional paired `SMTP_USER` / `SMTP_PASS`,
`MAIL_FROM` and `SUPPORT_EMAIL` on the server. Missing or unsafe configuration produces `failed`,
never a simulated successful send. In non-production mode only localhost, 127.0.0.1, ::1 and the
compose service `mailpit` are allowed hosts. Use `npm run services` for the team's Mongo/Mailpit
compose stack; Mailpit's viewer is http://localhost:8025. No development test sends to a real team.

The transport fixes from/to/subject on the server, uses the validated user email as replyTo,
escapes all body text in HTML, disables Nodemailer file/URL access, and attaches no files.
Diagnostics are fixed messages without raw request bodies or transport errors.

## Public port for Student 4

```ts
notifyQuote(input: {
  quoteId: string;
  companyName: string;
  contactEmail: string;
  locale: 'en' | 'es';
}): Promise<'sent' | 'failed'>
```

Save the quote first, call this port, and persist the returned status. It catches SMTP outages.
For tests, `createNotifications({env, transport})` accepts a `NotificationTransport` with
`sendMail(message): Promise<{accepted: string[]}>`. Only an acknowledged configured recipient
means `sent`. Quote IDs/company/contact are included, never an uploaded corporate design file.

## Verification

Run from the repository root in Ubuntu/WSL with Docker services started. Keep the test URI local;
the HTTP harnesses refuse nonlocal targets and use isolated test databases.

```sh
export TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test_ci
VITE_API_MODE=mock npm run check
npm run build
VITE_API_MODE=mock npx playwright test --config tests/member-5/playwright.config.ts
npx playwright test --config tests/member-5/playwright.http.config.ts
VITE_API_MODE=mock npm run test:e2e
```

The Mongo test refuses database names outside `solcacao_test_*`, deletes only its synthetic
requestId and skips explicitly without a URI. The SMTP test uses a loopback-only ephemeral sink
and actual Nodemailer SMTP; it needs no Mailpit install. Unit store doubles do not prove Mongo
persistence. See the owned evidence/handoff for actual results and outstanding integration work.

## Phase 3 real integration checks

The new HTTP and browser harnesses derive unique `solcacao_test_member5_*` databases, refuse
nonlocal/production targets, seed through the documented catalog CLI, and drop only their own
database on normal shutdown. The API suite uses a non-relaying SMTP sink on loopback. The browser
suite uses actual Docker Mailpit on ports 1025/8025, reads only captured messages, and stops this
repository's Compose `mailpit` service to verify outage behavior. Harness cleanup restarts Mailpit.
The real API suite also registers a synthetic business account and exercises Krish's merged quote
route: accepted SMTP, duplicate replay without another email, and a saved failed notification
after the SMTP sink stops. No peer implementation or public signature is changed.

The browser harness serves on 127.0.0.1:4015 and Vite on 127.0.0.1:5176 with HTTP mode forced.
Its `/__test/*` observation/control routes live only in `tests/member-5/http-browser-server.ts`,
never in the production app. Tests check real stored snapshots, lost-response retry, one email,
SMTP outage receipts, keyboard selection and EN/ES layouts at 375/768/1440 pixels.

Global malformed JSON and oversized bodies are already mapped to 400/413 `VALIDATION_ERROR`
in the shared handler. The real API integration test verifies those responses without editing
Member 1's handler. The historical shared parser error-code blocker is resolved.

## Live demo and deployment verification

Use the app and protected Mailpit URLs in `docs/deployment.md`. Production SMTP stays on Railway's
private network; SMTP configuration and inbox UI authentication are separate. Enter credentials
only in an ignored local environment or the host's secret settings. Never put them in a VITE
variable, screenshots, traces, evidence, or Git. `tests/member-5/playwright.deployed.config.ts`
runs deployed page checks and synthetic contact/feedback/sampler submissions in EN/ES. Supply
`MEMBER5_LIVE_MAIL_USER` and `MEMBER5_LIVE_MAIL_PASSWORD` via the environment; missing credentials
fail explicitly. It verifies receipt IDs and synthetic message markers in the actual protected
Mailpit API, not merely the application's `sent` response. No real customer mailbox is contacted.

With the test URI exported above and the live inbox credentials supplied privately, run:

```sh
npx playwright test --config tests/member-5/playwright.deployed.config.ts
```

`sent` means the configured SMTP recipient accepted the message; it does not prove a human read
it or promise manufacturing, pricing or delivery. A failed or pending email status leaves the
saved inquiry/quote intact. Reusing its request ID recovers that receipt without resending mail.
An operational resend/recovery worker is outside this contract; a process crash can leave pending.

No database triggers are specified. Unique requestId indexes, canonical hashes, insert-before-send
ordering and atomic status updates provide the required service behavior. Tests verify concurrent
duplicates and status persistence. The deployed checks exercise the existing deployed branch;
new local changes require the coordinator's reviewed merge/deployment and a rerun afterward.
