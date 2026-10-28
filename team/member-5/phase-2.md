# Student 5 Phase 2 — Core Development

Blueprint execution window: Weeks 3–4. Academic checkpoint mapping: docs/roadmap.md. Read context.md, docs/contracts.md, docs/api.json and your member context first. Preserve owner boundaries.

## Current assignment: Front-end Development (15%)

Daniel's instruction for this assessment is **Member 5 only**, covering a complete React-based
user interface, responsive design implementation, client-side functionality, and a required demo.
Keep all existing code. This documentation update does not authorize more backend development,
another member's features, or the next phase.

### Sources and scope

- `solcacao-project-requirements.docx`, section 4, Student 5: contact pages, feedback systems,
  custom chocolate sampler builders, informational static views, and external WhatsApp redirection.
- The same document's sections 1 and 8 establish Spanish/English presentation, responsive styling,
  working interactions, and a professional chocolate-store appearance.
- The academic checkpoint supplied by Daniel is **Phase 2: Front-end Development (15%)**:
  complete React UI, responsive design, client-side functionality; **demo required: Yes**.
- The DOCX's section 7 separately calls its Phase 2 "Core Development" and includes REST routes
  and validation tests. That broader blueprint is retained below as reference. Existing backend
  code stays in place; database/SMTP integration is not evidence required to demonstrate this
  frontend-only checkpoint under Daniel's current instruction.

### Required Member 5 frontend features

The implementation column describes existing code and previously recorded checks. It does not
claim a completed student demo, peer approval, or assignment submission.

| Feature                    | What the frontend must do                                                                                                                                           | Current implementation / remaining work                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contact page               | Provide labeled name, email, category and message controls; validate entries; show understandable errors and a submission confirmation.                             | Implemented at `/en/contact` and `/es/contact`, using disclosed mock submissions.                                                                                                        |
| Feedback                   | Accept feedback through a usable form with validation and confirmation.                                                                                             | Implemented at `/en/feedback` and `/es/feedback`. A rating system is not specified in the DOCX.                                                                                          |
| Custom sampler             | Let the user choose products, adjust quantities, review the selection and submit an inquiry with contact details.                                                   | Implemented at `/en/sampler` and `/es/sampler`, using the catalog API and the existing six-piece project rule.                                                                           |
| Informational static views | Present readable, useful information with working navigation and appropriate imagery.                                                                               | Implemented in both languages with DOCX-supported platform copy, product-information enquiry guidance, localized metadata and working catalog/contact links.                             |
| WhatsApp redirection       | Offer a user-activated link that opens the intended WhatsApp conversation with an encoded generic message.                                                          | Implemented and tested with a synthetic number. Daniel confirmed no business number exists yet; configure a WhatsApp-enabled US number when available. The link stays hidden until then. |
| Responsive design          | Keep forms, selection controls, images, text and actions usable on phone, tablet and desktop without horizontal overflow.                                           | Existing browser evidence covers 375, 768 and 1440 px. Repeat the student walkthrough before the demo.                                                                                   |
| Client-side behavior       | Update sampler count/summary; prevent invalid or repeated pending submissions; preserve valid entries after failure; distinguish pending, error and success states. | Implemented with typed mocks. Catalog loading, error and empty states are present.                                                                                                       |
| English/Spanish            | Translate Member 5 labels, errors and confirmations; retain mounted form values and sampler selection when switching language.                                      | Implemented through the shared locale provider and matching support dictionaries.                                                                                                        |

### Remaining frontend completion checklist

- [x] Add English/Spanish informational copy using the supplied DOCX's platform details. Story
      explains the catalog and business journeys; Care explains available product details and the
      contact path for questions. No invented history, certifications or product safety instructions
      are added. Team visual/editorial review remains part of the review item below.
- [ ] Obtain a team-approved WhatsApp business number. Configure `VITE_WHATSAPP_NUMBER` in the
      local environment as country code plus digits only, restart Vite, and verify the link's destination
      and encoded generic message. Do not automatically send a message or include private form text.
      Daniel confirmed there is no number set up yet. The intended US format is `1` followed by
      ten digits; do not substitute a made-up destination. See `client/src/features/support/README.md`.
- [ ] Complete the manual phone/tablet/desktop walkthrough, including long Spanish labels and
      Tab/Shift+Tab/Enter navigation. Record actual observations in `phase-2-evidence.md`.
- [ ] Rehearse and deliver the Member 5 frontend demo below. Record the real demo date/results;
      automated tests alone do not satisfy a required student presentation.
- [ ] Obtain the team's required visual/code review before integration. Keep any teammate-owned
      test fix in the existing handoff; do not edit another member's files to finish this checklist.

### Frontend demo acceptance checklist

Use fictional contact details and disclose that submissions are mocked. Check these boxes only
after the walkthrough or demo actually occurs; existing automated results remain in the evidence file.

- [ ] Contact: submit empty/invalid fields, correct them, then show the mock confirmation.
- [ ] Feedback: enter feedback and show validation plus a successful mock submission.
- [ ] Sampler: select products, adjust quantities, show the count/summary, reject an incomplete
      selection and submit the valid selection as an inquiry.
- [ ] Failure recovery: trigger the existing development failure control, show retained entries,
      and retry successfully without duplicate pending submissions.
- [ ] Language: switch EN/ES while a form and sampler selection contain values; show preserved state.
- [ ] Information: show the completed static views and their contact/navigation links.
- [ ] Messaging: activate the configured WhatsApp link and verify the intended conversation opens.
- [ ] Responsive/keyboard: show phone, tablet and desktop layouts and operate the form by keyboard.

### Existing project choices, not additional document requirements

The DOCX requests a sampler and informational views, but does not specify an exact piece count
or require pages named Story/Care. Six pieces, those page names, precise validation bounds,
the development failure button, and retry handling are existing implementation/contract choices.
Retain them without presenting them as extra professor-mandated features. A feedback rating
system, payment flow, messaging automation, additional page types, and live deployment are not
additions needed for this Member 5 frontend checkpoint.

### Verification for this frontend checkpoint

Run from Ubuntu WSL in the project root, using the Node version in `.nvmrc`:

```sh
nvm use
npm run dev:client
```

Open the `/en/contact`, `/en/feedback`, `/en/sampler`, `/en/story` and `/en/care` routes at the
Vite URL shown in the terminal. Test the `/es/` equivalents using the shared language switch.
In a second Ubuntu terminal, the existing frontend checks are:

```sh
nvm use
npx vitest run tests/member-5/pages.test.tsx tests/member-5/adapters.test.ts
npx playwright test --config tests/member-5/playwright.config.ts
npm run typecheck
npm run build
npm run check:ownership -- --member 5 --base origin/development
```

These commands are a verification plan, not a claim that they were run during this documentation
update. Capture actual results, screenshots, pending content and configured-link observations in
the evidence file. Keep whole-project failures and previously skipped backend checks visible,
without confusing them with demonstrated frontend functionality.

## Retained blueprint reference

The original broader Phase 2 plan below is kept for traceability and to preserve the context for
existing code. For the current frontend assessment, use the scope and acceptance checklist above.
The backend steps below do not request new backend work in this task.

## Entry conditions

Your prior phase must be integrated and current development synchronized. Use published peer ports; report unavailable dependencies without taking over their code.

## Ordered implementation steps

### Frontend track

1. Build ContactPage and FeedbackPage using shared form primitives or native elements until primitives merge. Category, name/email/message validation match shared inquiry schema; errors focusable, pending prevents double-submit.

2. Implement support/mock.ts storing synthetic inquiry receipts in memory with stable requestId retry behavior; simulate failure without losing form state. No real SMTP/network mail in Phase2.

3. Build SamplerPage selecting exactly six pieces across active products from api.catalog.list/get. Repeated choice increases quantity but submit array contains unique productIds. Display count and selection summary; avoid invented sampler pricing.

4. Submit sampler as category=sampler with samplerItems and contact/message fields to same support API. Keep it separate from retail cart to avoid creating a made-up product/order type. Backend validation planned for Phase3.

5. Build StoryPage and CarePage layouts and supplied-content slots. Do not invent certifications/history/health claims or product safety guidance; mark content pending in evidence. Use readable prose layout matching store design.

6. Add WhatsApp link only when valid digits-only VITE_WHATSAPP_NUMBER is configured. Encode a generic enquiry message, open on user click, never auto-send or append private form text.

7. Create support.* EN/ES keys and verify state preservation. For feedback use category=feedback without a separate API contract. Publish notifyQuote input signature already fixed in contracts.md to Student4.

8. Prepare reusable fake notification transport test design and content/asset needs list for later phases.

### Backend track

1. Implement Inquiry model with unique requestId/hash, category, contact/message, optional sampler snapshots and truthful notificationStatus. Persist before attempting SMTP. Same requestId/body yields original receipt, differing body409.

2. Implement POST /inquiries using shared inquiry schema plus server-side unique sampler IDs and active-product lookup through catalog service port. Reject nonexistent/inactive items and invalid six-piece total. Never trust client-provided product descriptions or prices.

3. Implement Nodemailer transport factory reading environment, with injected test transport. In development use Mailpit or equivalent local sink. Email recipients/from are configured server-side, user email only validated replyTo; sanitize/escape HTML and prevent header injection.

4. Export notifyQuote with exact contract. Build mail from saved request identifiers and required public business fields only; do not attach branding files. Return sent/failed without throwing on SMTP outage. Log only sanitized diagnostics; no full contact body/token.

5. Implement inquiry notification similarly; persisted inquiry remains status received if mail fails. Do not mark sent before transport acknowledgement. No repeated automatic retries sending duplicates on same requestId; document manual operational retry as outside current UI.

6. Add rate limits and body size validation for public inquiries. Feedback shares same route. Register only your router; coordinate shared app changes through Student1.

7. Implement support/http.ts exact endpoint and error mappings. Test adapter round trip and successful save despite failed notification; keep frontend mock mode until Phase 3.

8. Write isolated Mongo + SMTP sink integration tests, fixture content only. Update environment/deployment mail section and provide Student4 a passing notifyQuote test/handoff.

## Acceptance scenarios

- [ ] Invalid email/short message blocked; API failure retains valid inputs.
- [ ] Sampler refuses5/7 pieces, accepts6, sends unique IDs with quantities.
- [ ] Inactive products not selectable; no unavailable API replaced with local duplicate catalog.
- [ ] WhatsApp absent when number blank; URL encoded when configured.
- [ ] Contact/feedback/sampler keyboard flow and EN/ES switch work.
- [ ] Support/feedback records saved and mail captured locally, never sent to real team.
- [ ] Malformed injection strings escaped; arbitrary recipient fields rejected.
- [ ] Missing/inactive sampler product rejected even if browser accepted it.
- [ ] SMTP outage returns received receipt with failed status and keeps DB record.
- [ ] Idempotent retry creates one inquiry and one notification attempt.

## Broader blueprint verification (retained reference)

Run npm run check and npm run build, plus owned behavior/schema tests and visual review. Phase2 includes real backend validation tests as well as mock frontend interactions. Phase3 requires real Mongo/API tests; mocks do not count. Phase4 requires actual launch evidence. Run npm run check:ownership -- --member 5 --base development. Shared docs/config outside ownership go as exact handoff proposals to the owner.

## Handoff and stop

Update phase-2-evidence.md, handoff.md and status.json using real results. Set ready_for_review only when owned checks pass; only a reviewer records integrated after the actual PR merge. A blocked check remains blocked. Every PR needs visual review, passing unit tests and at least one peer approval. Stop before commit/push/merge/deploy unless the teammate explicitly asks. Never implement the next phase automatically.

## Blueprint demo reference

Show support validation, feedback, six-piece sampler and mock receipt, then static content layouts and optional WhatsApp entry.
