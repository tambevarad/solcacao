# GitHub repository setup

The delivered archive is an initialized local Git repository. Remote creation status is recorded in docs/validation.md. No fabricated collaborator handles or branch protection claims.

## Publish if no remote was created

Install GitHub CLI from its official distribution, sign in with `gh auth login`, and run from extracted repository:

```sh
gh repo create solcacao --private --source=. --remote=origin --push
git push origin main development student1-phase2-auth student2-phase2-shell student3-phase2-catalog student4-phase2-b2b student5-phase2-support
```

Use a different repository name if solcacao already exists; do not overwrite another project. This command creates a private repository in the authenticated personal account. Organization ownership and public visibility need an explicit team decision. The current branch should be main for initial publication. After publishing, feature work happens only on named branches.

## Required remote settings

Protect main and development: PR required, at least1 peer approval, dismiss stale approvals on new commits, require passing CI/verify check after it exists, require resolved conversations, block force pushes/deletion. Keep main stable; merge development into main through a reviewed release PR. Confirm available protection features for your account/repository visibility; if unavailable, document the limitation rather than claiming enforcement.

Populate team/roster.json with actual names/handles. Invite only the explicitly identified teammates with the intended access. Student2 may create CODEOWNERS from these verified handles using ownership.json. This template does not send invitations or assign unknown people.

Enable the local guard: `node scripts/setup-hooks.mjs`. It blocks direct local commits to main/development. Local hooks are a convenience; remote branch protection is the enforcement layer.

## Teammate routine

```sh
git fetch origin
git switch development
git pull --ff-only origin development
git switch -c YOURNAME-phase2-auth
npm ci
npm run phase -- --member 1 --phase 2
```

If the target branch already exists, switch to it instead of recreating it. Preserve dirty changes before switching. After the agent stops, review diff, run checks, stage only owned paths, commit, push that feature branch and open PR to development. Never paste secrets in PR descriptions. Next phase starts from updated development, not an old feature branch. PR body uses .github/pull_request_template.md; visual review/unit checks/peer approval required.
