# SolCacao five-student implementation template

A requirements-audited React/Express/MongoDB starting repository with original UI reference assets and twenty phase playbooks. It contains architecture and placeholders, not a completed chocolate store. Begin with TEAM-QUICKSTART.md and docs/student-playbook.pdf.

## Required sequence

Follow the blueprint exactly: Phase1 Weeks1–2 Architecture & Setup; Phase2 Weeks3–4 Core Development (frontend AND backend); Phase3 Weeks5–6 Integration & API Bind; Phase4 Weeks7–8 Audit, Polish & Launch. docs/roadmap.md maps these to the screenshot’s four academic deliverables, including Phase1 ERD/schema/three-page overview/MarvelApp-or-MockFlow prototype.

## Setup and one agent instruction

Coordinator first publishes/reviews this revision into development and configures main/development protection per docs/github-setup.md. Each student uses their own checkout and dedicated name-prefixed branch from roster.json.

```sh
npm run setup -- --member 3
```

Then tell your open coding agent:

```text
Run npm run agent -- --member 3 --phase 1. Read .agent/task.md and all its
references. Implement only that member and phase; run checks and update
handoff/evidence. Stop before commit/push/merge/deploy or another phase.
```

Change3 and1 for the student/phase. The CLI generates a full task packet; your chosen coding agent performs the work. Node24.19.0, Git and repository access are prerequisites. Docker is needed for the supplied local Mongo/SMTP sink; npm run services starts them. npm run dev starts web/API; npm run dev:client runs the mock frontend only. No real emails or payments are sent by setup.

## Documents and assets

- context.md and AGENTS.md: shared rules and stable contracts.
- team/member-N/context.md and phase-1.md through phase-4.md:20 detailed playbooks plus evidence/status.
- docs/requirements-audit.md and requirements.md: source-by-source audit and owner/phase coverage.
- docs/roadmap.md: exact eight-week roadmap and academic crosswalk.
- docs/contracts.md, docs/api.json, contracts/: canonical DTOs, HTTP shapes and validators.
- docs/data-model.md and docs/phase1/: schema, ERD, three-page overview draft and external prototype assembly kit.
- docs/design/: Fran’s observations, SolCacao layout proposals, tokens and original wireframes/placeholder asset register.
- docs/integration.md, submissions.md, weekly/: merge order, demos, weekly logs.
- docs/student-playbook.pdf: student setup,20 exact prompts, review/submission routine.
- docs/validation.md: actual checks and limitations.

## Checks

npm ci, npm run check, npm run build. Browser tests require npx playwright install chromium, then npm run test:e2e. Initial tests verify scaffold/contracts, not unimplemented product behavior. No mock may silently replace a failing real API in Phase3/4.

## Revision status

The audited template is on GitHub and merged into development through PR #1 and PR #2; main has not received a release PR yet. Phase 2 starts from development; the shell foundation PR and the team working guide are described in docs/integration.md. Branch protection settings and a hosted external prototype are not claimed here. Academic Phase1 draft artifacts require team completion/review and a real MarvelApp/MockFlow prototype. No prompts can guarantee error-free code or supply human approvals; the repository makes contracts, dependencies and checks explicit.
