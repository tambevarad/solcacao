# Start here

Read docs/roadmap.md: Phase1 is real setup/schema/routing/translation work. Phase2 includes frontend AND REST coding. Phase3 binds real APIs. Phase4 polishes/deploys/presents. The screenshot’s academic checkpoints are separately retained.

## Coordinator once

Publish and peer-review the audit branch into development using docs/github-setup.md. Assign exactly five members in roster.json; configure both protected branches. Review defaults in decisions.md and the draft Phase1 artifacts. Obtain a real MarvelApp/MockFlow prototype project for the academic requirement. No host credentials, prototype URL or reviewer identity is invented by this template.

## Each student before work

Install Git, Node24.19.0 and an agent-enabled editor. Use a separate clone per student. Install/start Docker for Phase2 Mongo/mail tests or configure approved equivalents. Open the reviewed repository folder, then run:

```sh
npm run setup -- --member 3
```

Replace3 with your assigned member number. Setup checks a clean checkout, syncs development, creates/switches your dedicated branch, creates local .env securely if absent, installs exact dependencies and enables local hooks. It stops on conflicts; it never force-resets or edits primary branches. For Phase2 onward run npm run services, then npm run dev as instructed by the phase.

## One instruction per phase to your open coding agent

```text
Run npm run agent -- --member 3 --phase 1. Read .agent/task.md and every
reference it names, then implement only that member and phase. Follow all
contracts and ownership rules, run checks and update evidence/handoff.
Stop before committing, pushing, merging, deploying or advancing phases.
```

Replace member/phase. The task-packet command works identically for all agents that can execute repository commands. It is not a vendor-specific AI launcher. For restricted agents attach the reference files and use the PDF prompt.

## Phase 2 coordination

Before starting Phase 2, read the "Phase 2 working guide" in docs/integration.md. It covers what the shell foundation PR provides, who owns which files, what you can build before and after it merges, how to sync, and the checks to run before opening a PR.

## After each phase

Review the diff and actual checks. Commit owned files, push dedicated branch and open PR to development. Get visual review, passing unit tests and one peer approval. Coordinator integrates all members, records weekly evidence, and submits only completed checkpoint deliverables. Previous integrated status is required before the next implementation phase. Docs/student-playbook.pdf contains every student’s four exact prompts and setup/review steps.
