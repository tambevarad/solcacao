# Week 5 integration record

State: recorded by the coordinator on 2026-11-12, while the first D22 turn is in progress.

Each member: PR/commit, owned progress, tests, visual reviewer and peer approval.

| PR  | Author     | Change                                                                                                               | Approved by | Merged                |
| --- | ---------- | -------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------- |
| #26 | tambevarad | Merges main into development after release #25 (no file changes), so development contains main before Phase 3 starts | Krishr21    | 2bdc09c (development) |

Plan change, decision D22 (docs/decisions.md): Phases 3 and 4 run together, one member at a time:

- Turn order: Student 2 (Varad), Student 4 (Krish), Student 3 (Reethika), Student 5 (Daniel), Student 1 (Aman), then a closing Student 2 turn for the release and tags.
- Each turn is one PR. Krish reviews Varad's PRs, and Varad reviews the others.
- The prompts for every turn are in the team's shared "SolCacao Phase 3 and 4 Plan" document.

In progress: Student 2's first turn on `varad-shell`:

- decision D22;
- pages that load on demand;
- production serving of the built client;
- live-API browser tests in CI;
- the production image and the Railway runbook.

Evidence is in team/member-2/phase-3-evidence.md and phase-4-evidence.md. Not reviewed or merged yet.

Integrated development commit: 2bdc09c (PR #26).

Demo observations: none recorded for the live API yet. The compiled app without a database was checked by Student 2; see team/member-2/phase-3-evidence.md.

Contract changes and affected owners: none (contractVersion 2). One shared-file change:

- `server/src/app.ts` (Student 1) gains a conditional mount for production serving.
- It is a coordinator-approved ownership exception under D22, because Student 1's turn comes last.
- Student 1 has not reviewed it yet.

Blockers and next week:

- The deployment waits for Varad's Railway account (runbook in docs/deployment.md).
- The live-API journeys and the image build get their first run in this PR's CI.
- Members without a working local MongoDB run the setup check before their turn.
- Krish's turn starts after Student 2's PR merges.

Do not prefill a review, attendance, commit or success that did not occur.
