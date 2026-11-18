# Week 7 integration record

State: recorded by the coordinator on 2026-11-17, after #38 merged and while #39 (the last change before the Phase 4 release) is in review.

Each member: PR/commit, owned progress, tests, visual reviewer and peer approval.

| PR  | Author     | Change                                                                                                                                                                       | Approved by | Merged                |
| --- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------- |
| #38 | tambevarad | The header fits at large browser fonts (Krish's note on #35): rem breakpoints, a compact header below 20rem, the drawer's search field wraps; records of the Phase 3 release | Krishr21    | 2246f14 (development) |
| #39 | tambevarad | The open teammate proposals, done by the coordinator (below); the 20-minute presentation plan; the Phase 4 submission documents and records                                  | in review   | —                     |

Phase 3 was submitted to the course (confirmed by Varad on 2026-11-16). The submission names tag `phase-3-submission` on `f16432c`.

Integrated development commit: 2246f14 (#38). Next: #39, then the release PR from `development` to `main`, the `phase-4-final` tag and the Phase 4 upload.

Coordinator work on teammates' proposals in #39 (Varad asked for the open proposals to be finished before the release; each is recorded as a coordinator ownership exception in the PR and in `team/member-2/handoff.md`):

- **Student 1 (Aman):** `describeForLog` also names Mongoose errors without their message (a `CastError` quotes the value). His other note, the trust-proxy default, was already fixed (`parseTrustProxy` returns 0).
- **Student 3 (Reethika):** `POST /api/orders` is throttled (30 per 15 minutes per client, 429 `RATE_LIMITED`); the catalog error handler logs through `describeForLog`; the quantity row wraps on a narrow card at large fonts.
- **Student 4 (Krish):** `POST /api/b2b/quote` is throttled (20 per 15 minutes per client, counted before sign-in); the B2B handler and the notification-status log use `describeForLog`; the featured cards show the origin in Spanish on `/es`; the hero and wholesale headings wrap long Spanish words.
- **Student 5 (Daniel):** the sampler reserves a screen of height while its products load (layout shift 0.13 on the deployed site); the piece counter wraps at large fonts.
- Tests: three new (the two throttles and the Mongoose log), and the shell's large-font check now includes 320 px at 24 px on all 14 pages.

Checks on #39 before review: `npm run check` with a local MongoDB 598/598, none skipped; mock browser tests 22/22; HTTP build; Prettier.

Demo observations: the six presentation recordings (`docs/presentation.md`) show each member's feature end to end. Recordings 1 and 6 are of the live site and the public GitHub record; 2–5 are of a local copy of the same build, because signing in on the live site is left to people.

Contract changes and affected owners: none to request or response shapes (contractVersion 2). `docs/api.json` adds the new 429 to the rules of `POST /api/orders` (Student 3) and `POST /api/b2b/quote` (Student 4).

Blockers and next week:

- #39 needs Krish's review; then the release PR (Krish reviews), the `phase-4-final` tag on `main`, Railway deploying `main`, and the Phase 4 zip.
- Not done, by people: the presentation rehearsal, the rollback rehearsal on Railway (runbook step 8), and the live journeys that sign in or read the deployed inbox.
- Still open: the WhatsApp number (the link stays hidden).

Do not prefill a review, attendance, commit or success that did not occur.
