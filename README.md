# SolCacao five-student implementation template

A requirements-audited React/Express/MongoDB repository with original UI reference assets and twenty phase playbooks. Phase 2 is integrated: every page works in mock mode, and the Express API runs against MongoDB. Begin with TEAM-QUICKSTART.md.

## Required sequence

Follow the blueprint exactly: Phase1 Weeks1–2 Architecture & Setup; Phase2 Weeks3–4 Core Development (frontend AND backend); Phase3 Weeks5–6 Integration & API Bind; Phase4 Weeks7–8 Audit, Polish & Launch. docs/roadmap.md maps these to the screenshot’s four academic deliverables, including Phase1 ERD/schema/three-page overview/MarvelApp-or-MockFlow prototype.

## Setup and one agent instruction

Follow TEAM-QUICKSTART.md. It covers the one-time installs and three copy-paste Claude Code prompts:

- review a PR;
- do my phase (the agent clones the repo, runs `npm run setup -- --member N`, implements, checks, commits and opens the PR);
- address review comments.

Node 24.19.0, Git, the GitHub CLI and repository access are prerequisites. Docker is needed for the local Mongo/SMTP sink (`npm run services`). Setup sends no real emails or payments.

### Run it

- **Demo (mock mode, no database):** `npm ci`, then `npm run dev:client` and open http://localhost:5173. Sign-in, persistence and notifications are mocked in the browser, and a full page reload signs you out. Fictional demo accounts: `retail@solcacao.test` / `retail-demo-pass` and `business@solcacao.test` / `business-demo-pass`.
- **Real API:** start Docker, then `npm run services` (MongoDB and the Mailpit SMTP sink at http://localhost:8025). `npm run setup -- --member N` writes `.env` with a random `JWT_SECRET`. Load the fictional catalog with `npm run seed:catalog`, then `npm run dev` starts the web app and API. The API refuses to start without a reachable MongoDB and a real secret.

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

npm ci, npm run check, npm run build. Browser tests require npx playwright install chromium, then npm run test:e2e. The persistence suites run against a real MongoDB when `TEST_MONGODB_URI` is set, for example `TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test_local npm test` after `npm run services`; CI runs them with a MongoDB service on every PR. No mock may silently replace a failing real API in Phase3/4.

## Revision status

The audited template is on GitHub and merged into development through PR #1 and PR #2. All five members' Phase 2 PRs (#3, #5, #9, #10 and #11) and the coordinator integration PR are merged into development; the record is docs/weekly/week-4.md. main is updated only through a reviewed release PR. Branch protection settings and a hosted external prototype are not claimed here. Academic Phase1 draft artifacts require team completion/review and a real MarvelApp/MockFlow prototype. No prompts can guarantee error-free code or supply human approvals; the repository makes contracts, dependencies and checks explicit.
