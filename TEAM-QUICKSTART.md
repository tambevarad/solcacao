# Team quick start

## Before anyone implements features

Assign the five roles in team/roster.json. Read docs/decisions.md together, especially simulated checkout, six-piece sampler inquiries and PDF-only branding uploads. If the instructor requires different behavior, make one shared contract PR before feature work.

Use the same Node version from .nvmrc and npm ci from the same lockfile. Copy .env.example to .env; Phase 2 uses mock mode and does not need MongoDB. Every teammate has their own clone and feature branch. Never have two agents edit the same checkout simultaneously.

## For each phase

1. Pull the latest development branch and create/switch to your named feature branch.
2. Open your agent (Gemini, Claude, Cursor, GPT or Copilot) in repository root.
3. Paste: **Read AGENTS.md, context.md and team/member-N/context.md. Implement only Student N Phase P according to its phase-P.md. Run its checks and update evidence. Stop before commit/push/merge.** Replace N and P.
4. Review what the agent changed and its test results. Ask it to fix concrete failures in the same phase; do not advance prematurely.
5. Commit your owned changes, push your feature branch and open a PR to development. A teammate reviews code and visual evidence.
6. After all five areas are integrated, the coordinator runs the phase demo checklist. Submit the approved commit/tag. Begin the next phase from updated development.

## Order that avoids missing dependencies

| Phase         | Integration order                                                                   |
| ------------- | ----------------------------------------------------------------------------------- |
| 2 frontend    | 2 shell -> 1 auth -> 3 catalog/cart -> 4 homepage/B2B and 5 support/sampler         |
| 3 backend     | 1 foundation/auth -> 2 localization and 3 catalog -> 5 notifications -> 4 B2B/files |
| 4 integration | All owners run shared journeys; 2 coordinates release and presentation              |

Independent feature work may overlap using the fixed contracts. The order above is when shared implementations become available for final integration. A blocked peer dependency is reported, not silently reimplemented.

## What agents must not decide independently

Field names, API routes, account roles, money units, global styles, provider signatures, package versions, cart merge rules, wizard field names, file limits or sampler behavior. These are fixed in shared docs and contracts. Necessary changes go through the designated owner and a reviewed PR.

## What the template already does

Installs, typechecks, builds, shows labeled route placeholders and exposes API health. It does not yet browse real products, authenticate customers, send requests/mail or process orders. Those features are the students' phase work.
