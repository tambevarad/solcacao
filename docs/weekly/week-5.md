# Week 5 integration record

State: recorded by the coordinator on 2026-11-12, updated on 2026-11-13 after the first D22 turn merged.

Each member: PR/commit, owned progress, tests, visual reviewer and peer approval.

| PR  | Author     | Change                                                                                                                                                                              | Approved by | Merged                |
| --- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------- |
| #26 | tambevarad | Merges main into development after release #25 (no file changes), so development contains main before Phase 3 starts                                                                | Krishr21    | 2bdc09c (development) |
| #27 | tambevarad | Student 2's Phase 3 and 4 turn (D22): decision D22, pages loaded on demand, production serving, live-API CI journeys, production image, Railway deployment and its verified results | Krishr21    | 62e52e4 (development) |

Krish approved #27 after running the full suite against MongoDB (545 passed, none skipped) and the live journeys locally, and after checking the deployed site. His four non-blocking notes are fixed in Student 2's follow-up PR.

Plan change, decision D22 (docs/decisions.md): Phases 3 and 4 run together, one member at a time:

- Turn order: Student 2 (Varad), Student 4 (Krish), Student 3 (Reethika), Student 5 (Daniel), Student 1 (Aman), then a closing Student 2 turn for the release and tags.
- Each turn is one PR. Krish reviews Varad's PRs, and Varad reviews the others.
- The prompts for every turn are in the team's shared "SolCacao Phase 3 and 4 Plan" document.

Integrated development commit: 62e52e4 (PR #27).

Demo observations: the deployed site (https://solcacao-production.up.railway.app) was checked on 2026-11-13; details are in docs/deployment.md:

- health reports the database connected;
- deep links work, and unknown pages and API paths return 404s;
- the catalog serves 14 active products;
- a guest order and a sampler enquiry were saved;
- the data survived a redeploy.

Contract changes and affected owners: none (contractVersion 2). One shared-file change:

- `server/src/app.ts` (Student 1) gains a conditional mount for production serving.
- It is a coordinator-approved ownership exception under D22, because Student 1's turn comes last.
- Student 1 reviews it in his turn.

Blockers and next week:

- Railway deploys `development` since #27 merged. On the trial's 500 MB volume MongoDB refused writes, so the project moved to the Hobby plan with a 5 GB database volume.
- The live-API journeys and the production image build run on every PR. They passed on #27.
- Members without a working local MongoDB run the setup check before their turn.
- Krish's turn starts now.

Do not prefill a review, attendance, commit or success that did not occur.
