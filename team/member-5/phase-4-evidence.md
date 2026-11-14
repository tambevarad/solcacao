# Member 5 Phase 4 evidence

Date: November 14, 2026. Branch: daniel-support. Phases 3 and 4 prepared together under D22.
Daniel authorized commit/push/PR publication on November 14. Merge and deployment are not claimed.

## Actual deployed verification

App: https://solcacao-production.up.railway.app
Protected demo inbox: https://mailpit-production-29902785.up.railway.app
Configuration source: docs/deployment.md. The inbox is a non-relaying demonstration sink;
confirming a real captured enquiry here does not claim delivery to a customer mailbox.

Ran tests/member-5/playwright.deployed.config.ts with TEST_MONGODB_URI set to the required local
URI and inbox credentials loaded only from an ignored local environment. No credentials in
tracked source, screenshots or traces. Results: **5 passed, 0 skipped, 0 failed**.

- At 375, 768 and 1440 px, opened contact, feedback, sampler, Story and Care in both EN/ES (30 route/viewport visits). Deep links returned 200, headings and document language were correct, no translation markers or horizontal overflow, and WhatsApp stayed hidden.
- Keyboard checked name -> email -> message focus and Enter on sampler quantity controls; controls are at least 44 px. Browser pageerror/console-error collection was empty in these page audits.
- Submitted synthetic contact, feedback and six-piece sampler enquiries in each language. All six POST /api/inquiries calls returned 201 with received/sent receipts. Independently opened the protected live Mailpit page (200) and read each matching message, checking its unique synthetic message marker and saved receipt ID. This is inbox evidence, not merely trusting notificationStatus.
- Did not stop production Mailpit, inject live failures or delete shared demo data. Outage and retry tests run locally against isolated MongoDB and Docker Mailpit (8/8 passing).

These tests exercise the currently deployed development version, not unpublished local code.
The new trusted sampler-email selection and retry messaging require the coordinator's reviewed
merge/deployment and a repeat of these deployed checks. No deployment/release is claimed here.

## Assets and measured loading

See asset-register.md and phase-4-performance.json. Reused existing approved responsive WebP
photos and catalog images; no duplicated asset or owner file changed. Story hero: 68,692 / 140,596
bytes at 640 / 1024. Care hero: 18,816 / 40,678 bytes. All meet existing shared budgets.
Above-fold heroes stay eager; sampler images use lazy loading and now asynchronous decoding.
There is no support-specific animation; six deployed measurement journeys used reduced motion.
Measurements record DOMContentLoaded, actual requested image variants, bytes and duration at
375/1440 widths without throttling. Cache/network conditions limit comparisons; no Lighthouse
score, artificial before/after speedup or real-device claim is made.

Build/typecheck passed. Full verification passed 584 tests (0 skipped/failed) on an identical
Linux source copy; 243 source/config/test files verified byte for byte. Shared browser regression:
15 passed. Owned visual regression: 7 passed. Owned real HTTP browser suite: 8 passed. All have
0 skips/failures on their successful runs. Phase-3-evidence.md records earlier failures and setup.
The cleanup rerun passed the same 584 tests and an explicit HTTP-mode production build. The
official ownership check passes the 35-file proposed source tree; see `commit-scope.md`.

## Four-minute presentation segment (draft, not a claimed rehearsal)

**0:00-0:35 - Channels and scope.** Introduce contact, feedback and the six-piece sampler.
Show the live English sampler. Explain that it creates an enquiry, not an order or payment,
and does not confirm pricing, stock allocation, manufacturing or delivery.

**0:35-1:25 - Selection and accessibility.** Select six pieces using the keyboard. Show the
selection count and disabled seventh addition. Switch to Spanish and explain that selections
remain. Point out visible labels, focus and phone layout. Use only fictional demo details.

**1:25-2:10 - Real API and data.** Submit once, show the 201 response and saved reference.
Explain that the server checks real catalog IDs and stores its own product snapshots rather
than browser-provided descriptions. Show the isolated test's one-record/one-mail retry result;
do not expose a database URI, token, inbox password or customer data on screen.

**2:10-2:55 - Request received versus email delivered.** Open the already-authenticated demo
inbox and match the receipt ID. Explain that SMTP accepted is separate from persistence and is
not proof of human reading. Quote requests use the same bridge after saving the private quote;
the corporate PDF is never attached to notification mail.

**2:55-3:35 - Graceful failure.** Use the local test setup to demonstrate a saved request with
failed email after Mailpit stops. Explain why the UI says not to resubmit a received enquiry.
For lost-response/timeouts, preserve the draft and reuse the request ID to recover the same
receipt. Never shut down the deployed mail service for this demo.

**3:35-4:00 - Evidence and limits.** State the tested EN/ES widths, real MongoDB/Mailpit
coverage, and matching live enquiry messages. Point to setup/SMTP docs. Note the hidden,
unconfigured WhatsApp link. Hand off to Varad for deployment and team workflow.

## Remaining human/coordinator actions

- tambevarad reviews the local diff and performs the required human visual approval.
- Daniel rehearses this segment with the team; face-to-face presentation and peer participation are not recorded as completed.
- After authorized commit/push and reviewed merge, coordinator deploys the changes and reruns the live checks. Member 5 did not deploy or change Railway settings.
- Actual WhatsApp destination is still missing; keep it hidden until supplied.
- Keep unrelated .vscode/settings.json and all ignored environment files out of the commit. Ownership checker currently flags only that existing untracked editor file.

Reviewer: proposed tambevarad. PR: none opened. Integrated commit: none.
