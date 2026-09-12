# Student 3 context — Catalog cart inventory and checkout

Read root AGENTS.md, context.md, docs/contracts.md, docs/api.json, docs/decisions.md and docs/design.md before implementation. Then read ONLY the requested phase file completely; future phases are context, not permission to implement them.

## Your ownership

- Client: `client/src/features/catalog/` including matching locales.
- Server: `server/src/features/catalog/`.
- Tests/evidence: `tests/member-3/` and `team/member-3/`.
- Additional ownership follows root context.md and docs/ownership.json.
- Requirement IDs: CAT-01–05; CART-01–04; ORDER-01.
- Public seams: catalog/public.tsx; catalog/mock.ts and http.ts; server/features/catalog/service.ts.

You must use the central DTOs and existing provider signatures. Read the existing implementation before replacing any file: a later session may be resuming partially finished work. Do not duplicate another member's state, models, middleware, seed data or translations. Pending peer work is a named dependency, not an invitation to implement it.

## Phase playbooks

- [Phase 2 — frontend](phase-2.md)
- [Phase 3 — backend](phase-3.md)
- [Phase 4 — integration](phase-4.md)

## Give this to any coding agent

```text
Read AGENTS.md, context.md, docs/contracts.md, docs/api.json,
and team/member-3/context.md, then team/member-3/phase-2.md.
Implement only Student 3 Phase 2 in my owned files.
Preserve the shared contracts and other owners' work. Verify prerequisites,
run the listed checks, and record real results in my phase evidence and handoff.
Stop before committing/pushing/merging and before starting the next phase.
```

For later phases replace both occurrences of Phase 2/phase-2 with the requested phase. Run `npm run phase -- --member 3 --phase 2` for a printable brief and status check.

## Completion protocol

Run `npm run check`, `npm run build`, targeted tests and the phase manual scenarios. Run `npm run check:ownership -- --member 3 --base development` before review. Unapproved shared-file changes require an owner handoff; the checker is a local aid and does not replace peer review. If a dependency prevents a full scenario, mark it blocked and identify the exact export/PR needed.

Update phase evidence and handoff with actual commands/results and changed paths. Set phase state to ready_for_review only when own checks pass. A reviewer changes it to integrated after merge and global verification. Proposed commit subject: `feat(catalog): complete phase N scope`. Do not claim all phases complete after a template build.

## Shared documentation and infrastructure handoffs

When a phase step asks you to update README, deployment/API/schema docs, asset register, CI or another shared file outside your ownership, write the exact proposed text/patch in your own handoff.md. Student2 integrates shared documentation/build/CI changes; Student1 integrates shared server changes. The request to document your work does not grant permission to edit another owner's files. Your own feature README, tests and evidence remain directly editable.
