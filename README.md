# SolCacao five-student implementation template

A requirements-audited React/Express/MongoDB starting repository with original UI reference assets and twenty phase playbooks. It contains architecture and placeholders, not a completed chocolate store. Begin with TEAM-QUICKSTART.md.

## Required sequence

Follow the blueprint exactly: Phase1 Weeks1–2 Architecture & Setup; Phase2 Weeks3–4 Core Development (frontend AND backend); Phase3 Weeks5–6 Integration & API Bind; Phase4 Weeks7–8 Audit, Polish & Launch. docs/roadmap.md maps these to the screenshot’s four academic deliverables, including Phase1 ERD/schema/three-page overview/MarvelApp-or-MockFlow prototype.

## Setup and one agent instruction

Follow TEAM-QUICKSTART.md. It covers the one-time installs and three copy-paste Claude Code prompts:

- review a PR;
- do my phase (the agent clones the repo, runs `npm run setup -- --member N`, implements, checks, commits and opens the PR);
- address review comments.

Node 24.19.0, Git, the GitHub CLI and repository access are prerequisites. Docker is needed for the local Mongo/SMTP sink (`npm run services`). `npm run dev` starts the web app and API; `npm run dev:client` runs the mock frontend only. Setup sends no real emails or payments.

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
