# Week 4 integration record

State: recorded by the coordinator on 2026-10-28. This record covers Phase 2 (weeks 3–4) as a whole; the week boundaries were not supplied, so dates are listed per PR.

Each member: PR/commit, owned progress, tests, visual reviewer and peer approval.

| Member                | PR             | Owned progress                                                                                                                                                         | Tests                                                                                                        | Visual reviewer and peer approval                        | Merged                                            |
| --------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------- |
| 1 Aman Gulati         | #11            | Auth UI (login, register, modal, account with profile and addresses), route guards, auth mock/HTTP adapters, JWT middleware, env validation, DB bootstrap, account API | Unit, middleware, adapter and page tests; real-Mongo persistence suite passed on 2026-10-28                  | tambevarad (screenshots at 1440/375, EN/ES)              | fc8ee86, 2026-10-28                               |
| 2 Varad Tambe         | #3, #6, #7, #8 | Shell, routing, localization, shared UI, navigation, CC0 image library, favicon/OG assets                                                                              | Shell, i18n, primitives, photos and e2e tests                                                                | Krishr21 (requested changes on #3 and #8, then approved) | 10fd054, 00381c0, 0bd8efa, 70bac90; 2026-10-25/26 |
| 3 Reethika Gajulapati | #9             | Catalog with URL filters, product page, cart drawer, simulated checkout, product/cart/order API                                                                        | Adapter, cart state, page, API rule tests; real-Mongo persistence suite passed on 2026-10-28                 | tambevarad (screenshots at 1440/375, EN/ES)              | 3873f6f, 2026-10-26                               |
| 4 Krish Ruparel       | #5             | Homepage, wholesale page, four-step quote wizard, quote API with private PDF storage                                                                                   | Wizard, page, adapter, API rule tests; real-Mongo persistence suite passed on 2026-10-28                     | tambevarad                                               | 6fc3f7b, 2026-10-26                               |
| 5 Daniel Yglesias     | #10            | Contact, feedback, six-piece sampler, Story/Care, inquiries API, SMTP notifications, notifyQuote                                                                       | Validation, idempotency, escaping, SMTP outage, adapter and page tests; real-Mongo test passed on 2026-10-28 | tambevarad (screenshots at 1440/375, EN/ES)              | 88c9a0d, 2026-10-28                               |

Coordinator integration PR #12, approved by danielyglesias and merged as e088f4b on 2026-10-28:

- real `requireAuth`/`optionalAuth`/`requireRole('b2b')` and `notifyQuote` wired into the catalog and B2B routers;
- startup builds every model's indexes;
- CI MongoDB service;
- cross-feature journeys;
- run instructions and these records.

The PR's CI passed (518/518, every member's persistence suite on real MongoDB). The push run after the merge failed before any test: a newer `mongo:8.0` image refuses to start on the runner's Linux 6.19+ kernel (SERVER-121912). A follow-up coordinator PR runs the CI service on `mongo:7.0`; 518/518 passed locally against 7.0.45. `compose.yaml` stays on 8.0 for local development.

Integrated development commit: e088f4b (all five member PRs plus PR #12). The annotated `phase-2-submission` tag marks the commit after the CI follow-up merges.

Demo observations (coordinator walkthrough in mock mode, not the academic demo):

- Every member's pages render with no console errors.
- No horizontal overflow at 375/768/1440 in EN and ES.
- Guest checkout reaches the confirmation page.
- The guest cart survives sign-in and clears on sign-out.
- A business account completes the quote wizard while switching to Spanish mid-flow.
- The sampler accepts exactly six pieces.
- Screenshots: docs/phase2/screenshots.

Contract changes and affected owners: none (contractVersion 2). Two shared changes:

- `t(key, values)` interpolation (D20, all members).
- The cross-origin pagination headers are exposed via CORS (Members 1 and 3).

Blockers and next week:

- Phase 1 status is still unrecorded for each member (D21).
- Phase 3 binds the UI to the real API.
- Phase 4 covers code splitting and deployment.
- The team still needs a real WhatsApp number.
- A release PR development → main follows the CI follow-up.

Do not prefill a review, attendance, commit or success that did not occur.
