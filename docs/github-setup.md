# Shared repository protocol

Source blueprint section6: two protected main/development branches; each student has a dedicated name-prefixed feature branch created from development; no direct primary commits; every PR requires visual review, passing unit tests and at least one peer approval. Weekly integrations are recorded. Student2 coordinates setup; all five contribute/review.

## Current revision and initial publication

The corrected template is on codex-requirements-audit. Existing main/development retain the previous snapshot; this revision does not fabricate peer review by silently updating them. No remote GitHub repository or protections are claimed. If remote tooling becomes available, create the private repository and a review PR; otherwise coordinator uses these steps.

1. Extract ZIP and open its directory. Confirm `git status --short` is clean and `git branch --show-current` is codex-requirements-audit. Install GitHub CLI and sign in (`gh auth login`); never paste tokens into agent chat.
2. From the audit branch run `gh repo create solcacao --private --source=. --remote=origin --push`. If name exists, choose an unused name; do not overwrite another repository. Team/organization ownership requires the team’s actual account choice.
3. Run `git push origin main development`, then `gh repo edit --default-branch main`. The audit branch was pushed by the create command.
4. Fill actual names, GitHub handles and name-prefixed dedicated branches in team/roster.json on this feature branch. Initial student1-auth etc are examples from the blueprint, not verified people. Commit only this setup change and push audit branch; do not invite guessed recipients.
5. Enable protection for BOTH main and development: PR required, one peer approval, dismiss stale approvals after updates, require CI verify to pass, resolve conversations, block force push/deletion. Confirm available protection support for the repository plan. If unavailable, record the gap and obtain an approved repository/account arrangement; local hooks alone do not satisfy protected branches.
6. Create PR: `gh pr create --base development --head codex-requirements-audit --title "Align SolCacao template with requirements" --body-file .github/pull_request_template.md`. Fill the body with actual diff/check/visual-review details before opening it.
7. An actual teammate visually reviews diagrams/wireframes/PDF and checks unit/build evidence, then approves. Merge through the PR only after the configured checks pass. No self-approval or scripted substitute.
8. Create reviewed release PR development -> main when stable. Clone/pull the reviewed development version; students now run setup. No student feature branch should start from the obsolete pre-audit snapshot.

## Dedicated branches

roster.json records one branch per member, initially student1-auth, student2-shell, student3-catalog, student4-b2b, student5-support. Replace prefix with actual name during setup; area suffix stays stable. Reuse that branch for later phases and synchronize development before new work. For simple history use merge commits and keep the branch after PR merge. If the team chooses squash/delete, setup must recreate/synchronize explicitly; never force-reset someone’s unmerged work.

## Every work/review cycle

Student runs setup -> gives one-phase instruction -> agent implements/tests/evidence -> student reviews diff -> student stages only owned paths and commits -> pushes dedicated branch -> opens PR to development -> reviewer performs visual review, checks passing unit tests, gives at least1 peer approval -> coordinator merges -> weekly integration demo/log -> approved release PR to main. Weekly records live in docs/weekly/week-N.md.

Local .githooks guard blocks direct main/development commits; it is convenience, not remote enforcement. check:ownership verifies path boundaries, not reviewer identity. No phase tag/submission record is created before actual acceptance.
