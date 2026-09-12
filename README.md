# SolCacao team implementation template

A shared starting point for five students building the CSE 5335 bilingual chocolate storefront and B2B quote platform. This repository contains infrastructure, interface contracts, placeholder routes, and phase-specific AI playbooks. It intentionally does **not** contain completed business features, product content, brand photography, or a finished website.

Read [TEAM-QUICKSTART.md](TEAM-QUICKSTART.md) for the simplest team routine.

## Start here

1. Read [context.md](context.md), then your [member context](team/README.md).
2. Use Node 24.19.0 (the version in .nvmrc; engine minimum 24.15). Run `npm ci` at repository root.
3. Copy `.env.example` to `.env`. Leave `VITE_API_MODE=mock` for Phase 2.
4. Run `npm run dev:client`; open `http://localhost:5173/en`. You should see a labeled template placeholder, not a store.
5. Run `npm run check` and `npm run build` to verify the starting point. `npm run dev` also starts the API health skeleton on port 4000. MongoDB is not needed for the template or Phase 2.
6. Ask your agent to implement **your role, one phase only**, using the command below. The `phase` script prints the instructions; it does not invoke an AI or generate code itself.

```text
Read AGENTS.md, context.md, docs/contracts.md, docs/api.json,
and team/member-3/context.md. Implement only Student 3 Phase 2.
Follow the playbook, preserve all public contracts and other owners' files,
run the required checks, and update my phase evidence and handoff.
Stop before committing, pushing, merging, or starting the next phase.
```

Replace `3` and `2` with your member and phase numbers. Run `npm run phase -- --member 3 --phase 2` to print the same brief plus prerequisites.

## Documents

| File                                         | Purpose                                                |
| -------------------------------------------- | ------------------------------------------------------ |
| [context.md](context.md)                     | Shared workflow and project rules                      |
| [team/README.md](team/README.md)             | Five ownership areas and commands                      |
| [docs/contracts.md](docs/contracts.md)       | Canonical types, behavior, cross-feature seams         |
| [docs/api.json](docs/api.json)               | Exact endpoint inventory and request/response types    |
| [docs/data-model.md](docs/data-model.md)     | Planned MongoDB collections, indexes and relationships |
| [docs/design.md](docs/design.md)             | Fran's-inspired visual direction and component rules   |
| [docs/decisions.md](docs/decisions.md)       | Explicit assumptions and change procedure              |
| [docs/requirements.md](docs/requirements.md) | Requirement-to-owner traceability                      |
| [docs/integration.md](docs/integration.md)   | Merge sequence and end-to-end acceptance               |
| [docs/submissions.md](docs/submissions.md)   | Phase demo and submission checklists                   |
| [docs/deployment.md](docs/deployment.md)     | Phase 4 deployment runbook template                    |
| [docs/github-setup.md](docs/github-setup.md) | Remote setup and branch protection                     |
| [docs/validation.md](docs/validation.md)     | Actual template validation results                     |

## Repository map

- `client/src/features/{auth,shell,catalog,b2b,support}`: owned React pages, mock/HTTP adapters, translations.
- `client/src/shared`: shared presentational primitives, maintained by Student 2.
- `client/src/api`: common HTTP transport and mode selection; no feature business logic.
- `contracts`: shared TypeScript DTOs and starter runtime validation. TypeScript checks are compile-time only; the backend must validate every untrusted request.
- `server/src/features`: matching Express routers and future models/services.
- `server/src/shared`: Student 1's future database, validation and security infrastructure.
- `tests/member-N`: each student's acceptance and regression tests.
- `team/member-N`: context, tasks, status and evidence.

## Important boundaries

The class screenshot defines Phase 2 = frontend, Phase 3 = backend, Phase 4 = integration and a 20–30 minute presentation. This takes precedence over the older blueprint's week-based phase labels. Phase 1 academic deliverables remain outside this implementation package; schema planning here is engineering input, not a claim that Phase 1 was submitted.

Simulated retail checkout, minimum wholesale quantity 50, and a six-piece sampler inquiry are documented project defaults, not professor-stated requirements. Change them through one reviewed contract update before dependent implementation.

The agents prepare reviewable work. Teammates review, commit and submit it. No prompt can guarantee error-free generated code or automatically certify a completed phase.

## Browser smoke test

Run `npx playwright install chromium` once, then `npm run test:e2e`. On Linux CI hosts, install required browser system libraries using the official Playwright setup instructions if needed. This initially checks only that the template route renders. Members add feature behavior tests in their phases; the coordinator replaces the scaffold assertion when homepage implementation lands.

## Version policy

Exact dependency versions and package-lock.json are committed. Use npm ci rather than fresh scaffolding or installing latest dependencies per teammate. Only Student2 changes dependency/build configuration through a reviewed PR. The scaffold was installed and verified against its lockfile; newer releases should not be assumed compatible without checks.
