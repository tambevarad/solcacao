# Week 6 integration record

State: recorded by the coordinator on 2026-11-14, during the closing D22 turn (PR #33).

Each member: PR/commit, owned progress, tests, visual reviewer and peer approval.

| PR  | Author             | Change                                                                                                                                                        | Approved by                | Merged                |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------------------- |
| #28 | tambevarad         | Student 2's follow-up to Krish's review of #27: the contact-enquiry journey checks the Mailpit inbox, and unknown pages answer 404                            | Krishr21                   | 13a60a2 (development) |
| #29 | Krishr21           | Student 4's D22 turn: the quote journey on the real API and the deployed site, uploads that survive a redeploy, lazy homepage photos                          | tambevarad                 | 2e06236 (development) |
| #30 | ReethikaGajulapati | Student 3's D22 turn: catalog, cart and checkout on the real API and the deployed site, measured indexes, the timing-flake fix                                | tambevarad                 | a1a8f9d (development) |
| #31 | danielyglesias     | Student 5's D22 turn: contact, feedback and the sampler on the real API, the enquiry email arriving in the deployed inbox                                     | tambevarad                 | e8d2215 (development) |
| #32 | amang26            | Student 1's D22 turn: sign-in on the real API, the team security sweep, `CLIENT_ORIGIN` allowlist and `TRUST_PROXY`, the CI flake fix                         | Krishr21, tambevarad       | 3e0c1f1 (development) |
| #33 | tambevarad         | Student 2's closing turn: the quote and sampler live journeys, the footer layout-shift fix, the focus-ring fix, the dependency audit, final records (this PR) | review requested: Krishr21 | not yet               |

Every member's Phase 3 and 4 work is in one reviewed PR (#27 and #28 for Student 2), as D22 planned. Each was reviewed against the deployed site and merged with a merge commit after CI passed.

Integrated development commit: 3e0c1f1 (PR #32, all five member turns).

Demo observations (deployed site, 2026-11-14; details in docs/deployment.md):

- health reports the database connected, and Railway deploys each merge to `development` automatically;
- every route in EN and ES at 1440 and 375 px loads with no overflow, missing translation or failed request;
- the catalog and guest-order live journeys pass against the deployed site;
- Lighthouse: accessibility 100 and SEO 100 on six pages. Mobile layout shift was poor (0.4–0.7) because the footer moved when a page arrived; #33 fixes it (0–0.09 measured on a local production build);
- `TRUST_PROXY=2`, measured with the registration rate limit, gives each visitor their own bucket; 1 did not.

Each member's own deployed-site results are in their `team/member-N/phase-4-evidence.md`.

Contract changes and affected owners: none (contractVersion 2 throughout Phases 3 and 4). Shared-file changes, all recorded as coordinator ownership exceptions:

- `server/src/app.ts` (Student 1), the client mount from #27: Student 1 reviewed it in #32 and agreed.
- `server/src/shared/README.md` and `server/src/features/auth/README.md` (Student 1), in #33: "1 on Railway" corrected to the measured 2. Docs only.

Dependency audit (#33): 31 npm audit findings (4 critical, 16 high) down to 2 moderate. Patched releases published before 2026-10-31, within the current major versions. The remaining two are react-router 6 (fixed only in 7): its backslash open redirect is not reachable through `safeReturnTo`, and its SSR issue does not apply.

Blockers and next week:

- #33 needs Krish's review. Then the release PR from `development` to `main` (Krish reviews), and, on Varad's go-ahead, the `phase-3-submission` and `phase-4-final` tags, Railway switched to `main` and the submission zip.
- Not done yet, by people: the presentation rehearsal (docs/presentation.md), the rollback rehearsal on Railway (runbook step 8), and the live journeys that sign in or read the inbox, run by Varad with the inbox password.
- Still open from earlier phases: Phase 1 statuses for Students 2–5 (D21), and the WhatsApp number (the link stays hidden).

Do not prefill a review, attendance, commit or success that did not occur.
