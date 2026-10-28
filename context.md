# Shared SolCacao context

## Goal and sources

Build a responsive Spanish/English React storefront and a separate business customization/quote journey using Express and MongoDB. Source: user-provided SolCacao blueprint and CSE 5335 Fall 2026 phase screenshot. Design reference: Fran's Chocolates, inspected September 12, 2026. Use its photography-led restraint and packaging clarity; create original SolCacao assets and content. No AI feature is required.

## What is already provided

One npm package and lockfile, React/Vite/Tailwind setup, Express health skeleton, route placeholders, shared DTOs, starter validation, mode-selected API adapter stubs, provider signatures, tests, PR template, CI and this implementation map. These are bootstrap infrastructure. Complete features are intentionally absent. A successful template build is not a completed course phase.

## Ownership

| Member | Owned frontend and backend          | Additional responsibility                                                                                      |
| ------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1      | `features/auth` in client/server    | Users, partners, addresses, server bootstrap/shared security/database                                          |
| 2      | `features/shell` in client/server   | Routes, layout, translations assembly, shared UI, build config, contracts stewardship, CI/release coordination |
| 3      | `features/catalog` in client/server | Products, inventory, cart, merge, simulated retail checkout                                                    |
| 4      | `features/b2b` in client/server     | Homepage, wholesale services, four-step quote wizard, private uploads                                          |
| 5      | `features/support` in client/server | Contact, feedback, sampler inquiry, static content, SMTP, WhatsApp                                             |

Each member owns `team/member-N`, `tests/member-N`, and their feature dictionaries. Do not rename these folders using personal names. Fill `team/roster.json` before assigning GitHub reviewers. Student 2 is integration coordinator, not the author of other students' work. Every member owns frontend AND backend implementation for their area.

## Phase discipline

Follow docs/roadmap.md exactly. Phase1 Weeks1–2 includes architecture/setup/schema/routing/translation planning AND the course’s ERD, three-page overview and external prototype. Phase2 Weeks3–4 includes both frontend components and REST endpoint development/validation. Phase3 Weeks5–6 binds real APIs and audits security/triggers/ES–EN. Phase4 Weeks7–8 optimizes, deploys and presents. The screenshot checkpoints are preserved through the crosswalk; neither source is silently superseded.

Each requested phase ends with owned tests/evidence and peer review. No auto-advance. A command generates a task packet for the coding agent; it cannot automatically provide unavailable credentials, a human review, a hosted prototype, or an academic submission.

## One phase execution protocol

1. Read the requested member/phase, existing status, shared contracts, and affected code. Check `git status --short`, current branch and recent commits. Preserve unrelated work.
2. Work on the dedicated `<name>-<area>` branch recorded in team/roster.json from current `development`. Never directly commit to main/development. For local-only repositories, use local `development`; when a remote exists, fetch and synchronize first. Do not overwrite a dirty checkout or force-push.
3. Compare prerequisites to actual files/exports and peer handoffs. If a dependency is pending, use the specified existing stub for unit work; explicitly record the blocked integration test. Never implement the other owner's internals as a shortcut.
4. Write a short owned checklist, then implement the phase steps in order. Use existing package versions and DTOs. No new state manager, UI framework, CSS architecture or database technology.
5. Use `api.<feature>` in UI; the HTTP envelope is unwrapped only by the common transport. Mock and HTTP adapters implement the same interface. Never call fetch directly in page components.
6. Run typecheck, targeted behavioral tests, build, ownership check, and the phase manual scenarios. No `any`, casts or suppressed errors to disguise incompatible types.
7. Update your `phase-N-evidence.md`, `handoff.md` and `status.json`. Mark `ready_for_review`, not `integrated`, after your checks pass. Blockers remain visible.
8. Report changed paths, behaviors, commands/results, screenshots if available, unresolved issues, and proposed commit message. Stop. The teammate reviews and commits; PR review and phase submission remain human-controlled unless explicitly delegated.

## Contracts and shared changes

`contracts/index.ts` fixes DTOs and public APIs. `docs/contracts.md` fixes business semantics. `docs/api.json` fixes HTTP routes. Existing public provider exports are stable. Runtime request validators must conform to all three. If they disagree, stop the affected change and document the mismatch; do not choose silently.

Student 2 maintains shared API/type contracts after review by affected owners; Student 1 owns central schema/ERD coordination. Submit a proposal identifying old/new fields, all consumers, migration and tests. Merge it before dependent feature PRs and bump `contractVersion` in `docs/api.json`. No two agents independently invent replacements.

Feature code can import another feature's documented public exports, not its internal components/models. Server services may use documented ports in docs/contracts.md. Do not modify global providers/routes for local convenience. Add required route changes through Student 2. Shared infrastructure changes go to Student 1 (server) or Student 2 (client/build).

## Fixed decisions

USD integer cents; `en`/`es`; lowercase `retail`/`b2b`; ISO timestamps; Mongo IDs as strings; JSON successes per the explicit wire exceptions in docs/contracts.md and `{error:...}` failures. Spanish does not change currency or product IDs. Authentication is required for quotes, optional for simulated retail checkout. Six-piece sampler creates an inquiry; it does not add an independently priced new product. See decisions and contracts for exact rules.

## Quality and evidence

Add behavior tests for validation, ownership, cart race/merge, upload failure and stateful journeys. Do not add tests asserting arbitrary implementation details. Test failures and unavailable Mongo/SMTP/browser tooling must be reported accurately. A successful mocked demo is valid for Phase 2 but never evidence of database integration.

No production content in this template. The included clearly labeled fictional fixture factory is for development/testing; do not invent verified organic certification, sourcing claims, customer reviews, contact details, delivery promises or real business locations. No copied Fran's logo, photography or text. Commit public assets only when permitted and record their source/license.

## Revision status

The audited template was published to GitHub and merged into development through PR #1 (codex-requirements-audit) and PR #2 (Phase 1 schema/ERD alignment). Students create their branches from development with npm run setup. Phase 2 is integrated on development: the shell foundation (PR #3), Student 4 (PR #5), Student 3 (PR #9), Student 5 (PR #10) and Student 1 (PR #11) merged after peer approval, and the coordinator integration PR wired Student 1's middleware and Student 5's notifyQuote into the catalog and B2B routers and added a CI MongoDB service. Phase 2 was released to main through reviewed release PRs #16 and #20 and tagged `phase-2-submission` at 1307a52; see docs/weekly/week-4.md. Branch protection on development and main requires one approval and the CI check, admins included. main remains stable and is updated only through a release PR. No reviewer identity, branch protection or submission is recorded here unless it actually happened. See docs/github-setup.md.
