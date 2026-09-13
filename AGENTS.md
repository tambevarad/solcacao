# Agent entry point

Read `context.md` first, then `docs/roadmap.md`, `docs/contracts.md`, `docs/api.json`, `docs/decisions.md`, and `docs/design/frans-reference.md` and the requested `team/member-N/context.md` including its current phase file. Read current code and `team/member-N/status.json` before editing. These files describe project conventions; explicit user instructions take precedence. Report consequential conflicts rather than silently rewriting the plan.

Implement only the requested member and phase. If either is missing and cannot be inferred from the user's request, ask for the missing identifier. Never implement all five roles simply because you can read their plans. Do not infer that a stub means its feature is completed. Do not invoke subagents unless the user authorizes delegation.

Preserve other owners' files and the contract. For a necessary shared change, prepare a change proposal in your own handoff with exact signature/schema impact. The designated owner integrates it in a separate reviewed PR. Do not bypass type checks, delete tests to make CI pass, invent secrets, claim skipped checks passed, or silently fall back from HTTP to mocks.

Do not commit, push, open/merge PRs, or deploy on behalf of a student unless their current instruction authorizes that action. Stop after the requested phase with changed files, checks, limitations, and a proposed commit message. Keep evidence truthful.

Use npm run agent -- --member N --phase P to generate a task packet. P can be1,2,3,4. Commands do not replace reading references. Obey docs/roadmap.md: backend coding is Phase2, binding is Phase3. Every primary-branch update requires reviewed PR; do not fabricate reviewer identity or silently bypass branch protection.
