# Member 5 Phase 2 working checklist

## Canonical phase scope and branch

Follow [the unchanged Phase 2 playbook](phase-2.md) and `docs/roadmap.md`: Phase 2
includes frontend components AND individual REST endpoints/validation tests. The academic
frontend checkpoint (15%) is part of that phase, not a replacement for its backend scope.

For PR #10 only, coordinator Varad Tambe approved keeping `daniel-phase2` and the exact
Member 4 integration-test correction. Phase 3 will use the roster branch `daniel-support`,
created through `npm run setup -- --member 5`. No branch is renamed or deleted for this PR.

## Coordinator review fixes for PR #10

- [x] Retarget PR #10 to development and confirm its narrowed file scope.
- [x] Apply the exact approved Member 4 test change in its own commit with the approval in its body.
- [x] Add/test singular sampler wording in EN/ES, retaining existing plural keys.
- [x] Verify the two-column phone sampler, hidden mobile descriptions and 44 px touch targets.
- [x] Restore phase-2.md exactly from origin/development after preserving this checklist.
- [x] Run the required checks and record exact pass/fail/skipped results.
- [x] Update evidence/status/handoff; PR publishing and CI are tracked on PR #10.
- [x] Reserve formal approval and merge for the coordinator; the agent does neither.

## Preserved frontend feature and demo checklist

The following feature table and outstanding demo items were moved from the earlier phase
playbook edit. They supplement the canonical phase, without restricting it to frontend work.

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
