# Member 5 handoff — Phase 2 follow-up

## Current publishing follow-up (2026-10-28)

Branch: `daniel-support`, updated to `origin/development` at `e088f4b` after PR #12.
This is a Phase 2 follow-up; Phase 3 has not started. Daniel explicitly authorized committing,
pushing and opening the follow-up PRs. Both PRs target `development` and require peer review.
The coordinator's original Phase 2 integration records are preserved in `status.json`;
their integrated state refers to PR #10, not these new follow-ups.

The sampler now clears its selected pieces and contact fields after a successful enquiry.
"Start another enquiry" opens an empty form. A failed submission retains the selection,
fields and retry request ID; a later new enquiry receives a new request ID.

Daniel also explicitly requested a quantity picker on regular shop product cards, similar
to the sampler controls. The separate catalog draft offers minus/plus buttons and direct number entry
before Add to cart, using existing English/Spanish catalog translations. It observes stock,
the 99-per-product cap and quantities already in the cart, retains the chosen amount after
failure, and resets to one after success. Existing queued quick-add behavior is preserved.
Daniel confirmed the sampler translation marker is resolved; no translation files changed.

### Member 3 review proposal for the requested catalog enhancement

The catalog enhancement is isolated on `daniel-catalog-quantity`, also based on `e088f4b`.
Its ownership checker flags exactly these two Member 3 files:

- `client/src/features/catalog/components/ProductCard.tsx`
- `client/src/features/catalog/pages/CatalogPage.tsx`

The private ProductCard prop changes from `onAdd(product: Product): void` to
`onAdd(product: Product, quantity: number): Promise<void>` and adds optional
`maxQuantity?: number`. Its sole production consumer, CatalogPage, passes the remaining
available quantity and forwards the selected number to the existing `cart.add(product.id,
quantity)` API. There is no DTO, HTTP schema, public provider, dependency or storage migration.
Regression tests live under `tests/member-5`; existing Member 3 tests are unchanged.

This is a user-requested review proposal, not a coordinator-approved ownership exception.
Member 3 must review and integrate the catalog portion through a separate reviewed PR as
required by AGENTS.md. Its exact handoff is `team/member-5/catalog-quantity-handoff.md` on that
branch. The sampler PR contains only Member 5 files; the two PRs can merge independently.

### Suggested PR wording

Sampler PR: **fix(support): reset the sampler after a successful enquiry**

Clear selected chocolates, contact fields and request identity after a successful enquiry,
so Start another enquiry begins empty. Preserve failed entries and the retry request ID.

Member 3 catalog PR: **feat(catalog): choose quantities before adding chocolates to the cart**

Add minus/plus controls and a quantity field to regular shop product cards, similar to the
sampler controls. Shoppers can choose an amount before Add to cart. Respect remaining stock
and cart limits, retain the amount on failure, and reset the field after success. This is an
additional user-requested retail improvement, outside the original Member 5 assignment.

Current validation and remaining limitations are recorded in `phase-2-evidence.md`.

## Historical PR #10 handoff

The following records the original pre-merge handoff. PR #10 has since been merged by the
coordinator; its former pending-merge statements do not describe this new local follow-up.

Phase 2: ready_for_review, not integrated.
PR: https://github.com/tambevarad/solcacao/pull/10 (base development).
Member: Daniel Yglesias / danielyglesias. Branch: daniel-phase2.

## Coordinator-approved exceptions

The coordinator approved keeping daniel-phase2 for this PR only. It is not renamed/deleted.
Phase 3 will use the roster branch daniel-support, created through npm run setup -- --member 5
when Phase 3 is authorized after integration. The playbook exactly matches origin/development;
Phase 2 retains frontend AND backend scope from docs/roadmap.md. Useful frontend feature/demo
checklists are preserved in checklist.md.

The former Member 4 test proposal is APPLIED IN PR #10 with coordinator approval. Commit
747bdbe changes only the specifically authorized lines in tests/member-4/quote-api.test.ts:
empty inquiry input now asserts 400 and VALIDATION_ERROR, while B2B auth assertions remain
unchanged. The commit body records coordinator approval. The ownership checker intentionally
continues to flag this one file (exit 1). No other peer file, shared contract or owner rule changed.

Other focused fixes: 74137d6 adds/test singular sampler wording; 47e5a86 makes phone cards
use two columns, hides phone descriptions and retains accessible 44 px quantity controls.

## Delivered public surface

- Existing default ContactPage, FeedbackPage, SamplerPage, StoryPage and CarePage exports and routes.
- createMockSupport(http) and createHttpSupport(http), unchanged SupportApi signatures.
- supportRouter, already mounted by the shared app, implements POST /api/inquiries.
- Existing shared dictionary assembly includes matching support EN/ES keys automatically.
- Catalog products are consumed only through api.catalog and getActiveProductsByIds.
- No DTO, HTTP path, public provider signature, dependency or database technology changed.

## notifyQuote handoff for Member 4

Import from server/src/features/support/notifications.ts:

```ts
notifyQuote(input: {
  quoteId: string;
  companyName: string;
  contactEmail: string;
  locale: 'en' | 'es';
}): Promise<'sent' | 'failed'>
```

Save the quote first; call the helper and persist the returned notification status. SMTP outages
resolve failed, never erase the saved quote and never attach the branding file. The transport
fixes recipient/from/subject server-side, validates replyTo and escapes HTML. Configure SMTP_HOST,
SMTP_PORT, SMTP_SECURE, optional paired SMTP_USER/SMTP_PASS, MAIL_FROM and SUPPORT_EMAIL.
Development mail is restricted to the local sink; no real team email was sent by these tests.

createNotifications({env,transport}) accepts a NotificationTransport with
sendMail(message): Promise<{accepted:string[]}>. Only acknowledgement of the configured recipient
means sent. The fake transport and actual Nodemailer loopback SMTP tests pass. This is not a
claim of Mongo or deployed Mailpit integration. See the owned backend README for operational details.

Inquiries save before notifying and use unique requestId/hash for retries. A failure to record
notification status can leave pending; repeated inquiry requestIds do not resend automatically.
Operational inspection/retry after a crash is outside the current UI.

## Checks and visual evidence

- Full check PASS on resource-limited retry: 352 passed, 32 explicitly skipped Mongo-dependent
  tests. Initial unrestricted WSL worker-start timeout attempt failed and is recorded in evidence.
  No tests/assertions/type checks were removed or suppressed.
- Build PASS; existing shared JS chunk advisory remains (535.99 kB >500 kB).
- Member 4 targeted endpoint suite: 16 passed. Singular wording + dictionary suite: 29 passed.
- Shared browser suite: 11 passed. Owned support suite: 5 passed at 375/768/1440 in EN/ES.
- Interactive keyboard/screenshot review: 18 journeys with validation, retry, locale retention,
  singular/plural selection, five/six-piece handling and no overflow/uncaught page errors.
- Representative screenshots are committed under team/member-5/screenshots/.
- Ownership: expected single approved Member 4 exception; all other changed paths are owned.
- Real Mongo test NOT RUN: Docker unavailable. State stays explicitly blocked for database evidence.
- Formal coordinator approval, merge and academic demo are not claimed by the agent.

See phase-2-evidence.md for exact commands, counts, initial infrastructure failure and artifacts.
CI is watched after push; the final result is reported on the PR, not inferred from local tests.

## Remaining integration proposals for owners

Student 1: implement the existing connectDb(uri:string):Promise<void> port, await DB connectivity
and InquiryModel.init() before accepting traffic, and align global malformed/oversized JSON errors
with the contract envelope (400/413 VALIDATION_ERROR). The owned router handles its own limit/errors,
but cannot fix an earlier shared app parser. No shared infrastructure was changed here.

Student 2 / schema coordinator: docs/data-model.md calls for flat InquiryInput fields, while the
Phase 1 schema-design table uses an input object. The implementation follows docs/data-model.md's
flat name/email/category/message/locale fields, plus requestId/hash, snapshots and statuses.
Proposed documentation correction: replace that table's input row with those scalar rows and
shared validation limits. No public DTO/API migration is needed; shared docs remain unchanged.

WhatsApp: Daniel has no business number yet; the intended format is country code 1 plus ten digits.
The link stays hidden until a real WhatsApp-enabled destination is provided. Setup is documented
in client/src/features/support/README.md. No fake live destination or account was created.

Proposed final documentation commit: docs(member-5): restore playbook, update evidence.
