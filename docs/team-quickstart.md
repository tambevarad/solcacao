# Start here

You do three things by hand: install the tools once, paste a prompt into Claude Code, and approve PRs. The agent does the rest: clone, setup, implementation, checks, evidence, commits and the PR.

Phases follow docs/roadmap.md:

- **Phase 1:** setup, schema, routing and translation planning.
- **Phase 2:** each member's frontend AND REST endpoints, working with mocks.
- **Phase 3:** connect to the real API.
- **Phase 4:** polish, deploy and present.

Who owns what is in team/roster.json (names, GitHub handles, branches) and docs/ownership.json (files).

## Once per person

1. Accept the GitHub invitation to `tambevarad/solcacao`.
2. Install Git, Node 24.19.0 (`nvm install 24.19.0`), the GitHub CLI and Claude Code. Install Docker as well if you will run the database and mail tests.
3. Sign in to GitHub: `gh auth login` (GitHub.com, HTTPS, log in with a web browser).
4. Make an empty folder, open Claude Code in it, and paste the prompt you need below.

## Prompt 1: review a pull request (any reviewer)

Replace `<PR>` with the PR number.

```text
Help me review pull request #<PR> in https://github.com/tambevarad/solcacao. I am the reviewer and I make the decision.
1. If this folder is not already a clone of that repo, clone it here with gh and work inside it. Check that Node 24.x is active (.nvmrc) and gh is signed in. If not, stop and tell me exactly what to run.
2. Read AGENTS.md, docs/context.md, docs/integration.md, docs/contracts.md and the PR description. Check out the PR (gh pr checkout <PR>), run npm ci, then npm run check, npm run build, and npm run check:ownership -- --member <the author's member number from team/roster.json> --base origin/development. Report every result exactly.
3. Review the diff for contract violations, edits outside the author's ownership, secrets, missing EN/ES keys, missing tests, and claims in the PR that the code does not back up. List concrete findings with file:line.
4. Start npm run dev:client in the background and give me a short checklist of pages and flows to look at in the browser at desktop and phone width, in English and Spanish.
5. Wait for me. Only if I explicitly say "approve", run gh pr review <PR> --approve with a short summary of what was checked. If I say "request changes", post my comments with gh pr review <PR> --request-changes. If I am the coordinator and explicitly say "merge", run gh pr merge <PR> --merge once it is approved and the checks pass. Never approve or merge on your own.
```

## Prompt 2: do my phase (any member)

Replace `<N>` with your member number and `<P>` with the phase.

```text
I am Member <N> on the SolCacao team; my name, GitHub handle, area and dedicated branch are in team/roster.json. Repository: https://github.com/tambevarad/solcacao. Implement my Phase <P> completely and open a PR for the coordinator to review.

Setup (do it yourself)
- If this folder is not already a clone of the repo, clone it with gh and work inside it. Check that Node 24.x is active (.nvmrc) and gh is signed in. If either is missing, stop and tell me exactly what to run.
- Run npm run setup -- --member <N>. It syncs development, switches to my dedicated branch, writes .env and installs dependencies. If it stops (for example, uncommitted changes or a diverged branch), explain why and resolve it safely. Never reset, force-push or discard my work without asking.
- If Docker is running, run npm run services. Run npx playwright install chromium.

Understand before editing
- Run npm run agent -- --member <N> --phase <P>. Read .agent/task.md and every file it references, plus docs/sources/blueprint.md, my rows in docs/requirements.md, and the current code in my feature folders, client/src/shared and client/src/features/shell/public.tsx.
- These are the source of truth: contracts/, docs/contracts.md, docs/api.json, docs/ownership.json, docs/decisions.md and docs/integration.md. If the packet notes a decision such as D21, follow it.
- Show me a checklist of my phase playbook steps and acceptance scenarios, then continue without waiting.

Rules
- Edit only files I own (docs/ownership.json). For anything else, write an exact change proposal in team/member-<N>/handoff.md.
- Use the shared shell and UI: useLocale().t, localizePath and usePageMeta, plus the components in client/src/shared/index.ts. Use the existing stack only and add no dependencies. The UI calls api.<feature>, never fetch directly. Never fall back silently from HTTP to mocks. Put EN/ES text only in my own locale files.
- If a teammate's part is not merged yet, use the existing stub or an injected dependency, with test doubles in tests only. Never write their code. Routes that need authentication must refuse access until real auth exists. Record every check that is blocked.
- Never invent business claims, credentials or secrets.

Verify, hand off, open the PR
- Run npm run check, npm run build, npm run check:ownership -- --member <N> --base development and npm run test:e2e. Check the UI by hand at 375/768/1440 widths, in EN and ES, with the keyboard. Report results exactly; never mark a failed or skipped check as passing.
- Update team/member-<N>/phase-<P>-evidence.md, handoff.md and status.json (ready_for_review, plus any blockers).
- You may commit in focused conventional commits, push my branch, and open a PR into development using .github/pull_request_template.md, requesting review from the coordinator (member 2 in team/roster.json). Never merge, approve, force-push, or commit to main or development.
Stop only for a genuine scope conflict or missing access. Finish with what you completed, the check results, the PR link and the remaining blockers.
```

## Prompt 3: address review comments (any member)

```text
Address the review comments on my open PR in https://github.com/tambevarad/solcacao (find it with gh pr list --author @me). Read every comment. Fix the valid ones within my ownership, rerun the checks from my phase playbook, push to the same branch, reply to each comment with what changed, and update my phase evidence. Do not merge or force-push.
```

## Who does what

1. **The member** pastes Prompt 2. The agent runs setup, implements the phase, runs the checks, records evidence and opens the PR.
2. **The reviewer** (the coordinator for member PRs; a teammate for the coordinator's PRs) pastes Prompt 1, looks at the running site, then says "approve" or "request changes". The coordinator then says "merge".
3. **If changes are requested,** the member pastes Prompt 3.

The blueprint requires a human visual review and at least one peer approval for every PR. The agent prepares the review, but a person decides. Each week the coordinator records the merged work in docs/weekly/week-N.md.

Details live in:

- the "Phase 2 working guide" in docs/integration.md: ownership, shared files, dependencies and merge order;
- docs/github-setup.md: branch protection and the review cycle.

AGENTS.md lets an agent commit, push and open a PR when the member's instruction authorizes it, as Prompt 2 does.
