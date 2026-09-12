# Student 2 — Core Layout, Navigation & Localization

## Read order

AGENTS.md -> context.md -> docs/roadmap.md -> docs/contracts.md -> docs/api.json -> docs/design/frans-reference.md -> this file -> requested phase-P.md. Read current status and code before editing. Source blueprint and screenshot are transcribed in docs/sources; keep both, with the crosswalk in roadmap.md.

## Exact ownership

Client and server features/shell, tests/member-2, team/member-2, and the additional paths in docs/ownership.json. You own this subsystem’s frontend AND backend. Student1 coordinates central database relationships; Student2 owns shared shell/static assets/localization and coordinates integration. Other features’ internal code is not yours.

## Four execution phases

1. [Phase1 Architecture & Setup](phase-1.md): Weeks1–2, including owned schema modeling, routing/interface setup and translation outline.
2. [Phase2 Core Development](phase-2.md): Weeks3–4, both React components and individual REST endpoints/validation tests/state synchronization.
3. [Phase3 Integration & API Bind](phase-3.md): Weeks5–6, real API binding, trigger review, security sweep and ES/EN audit.
4. [Phase4 Audit, Polish & Launch](phase-4.md): Weeks7–8, optimization, live deployment, documentation and team presentation.

## One instruction to your coding agent

```text
Run npm run agent -- --member 2 --phase 1. Read the generated task packet
and every required reference it names. Implement only that member and phase,
following its steps and exact contracts. Run checks, update evidence and handoff,
and stop before commit/push/merge/deploy or starting another phase.
```

Change only the phase number for later phases. The command creates the full packet at .agent/task.md; it does not launch a vendor-specific AI itself. Give the instruction to an already open agent in this repository. If your agent cannot run shell commands, attach the same listed documents and use the equivalent prompts in the PDF.

## Before implementation

Use the dedicated branch from roster.json (initial alias student2-shell); its prefix is replaced by the actual student name at team setup. Branches originate from development and are synchronized before each phase. Do not create a separate primary branch or commit directly to main/development. Use npm run setup -- --member 2 after the revised template has been reviewed into development.

## Finish

Run npm run check, npm run build, owned tests and visual scenarios. Update your own phase evidence/status/handoff. When a step requests a shared README/API/assets/CI change outside your paths, write an exact patch proposal in your handoff for its owner; do not silently edit another member’s files. The teammate reviews/commits, opens a PR, receives one peer approval and joins the weekly integration demo. A command or agent cannot self-award human review or course submission.
