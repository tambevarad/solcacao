# Support backend

Owner: Student 5. Phase 2 implements `POST /api/inquiries` and the notification bridge.

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

```sh
npx vitest run tests/member-5
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test_member5 npx vitest run tests/member-5/mongo.test.ts
npx playwright test --config tests/member-5/playwright.config.ts
```

The Mongo test refuses database names outside `solcacao_test_*`, deletes only its synthetic
requestId and skips explicitly without a URI. The SMTP test uses a loopback-only ephemeral sink
and actual Nodemailer SMTP; it needs no Mailpit install. Unit store doubles do not prove Mongo
persistence. See the owned evidence/handoff for actual results and outstanding integration work.
