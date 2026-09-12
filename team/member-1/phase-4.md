# Student 1 Phase 4

## Outcome

Prove your feature works in the integrated HTTP application and supply final deployment/demo evidence.

## Entry conditions

Own Phase 3 integrated; peers’ HTTP routes available. Coordinate with Student 3 on cart transitions and Student 4 on role guards.

Read your context.md and current status/evidence first. If previous phase is not integrated, explain the dependency; do not silently skip it. Root context.md and docs/contracts.md remain binding.

## Ordered implementation steps

1. Test login/register through the real UI with VITE_API_MODE=http. Verify token becomes available before the cart merge call; no duplicate requests from StrictMode create duplicate accounts or carts.

2. Integrate account/addresses and error translation. Verify reload prompts login according to the memory-token design, logout clears local identity, and an in-flight request cannot restore a logged-out user.

3. Exercise guest/retail/business entry to quote wizard together with Student 4; verify the backend still blocks unauthorized direct POST/file retrieval even when UI guards are bypassed.

4. Review JWT expiry UX, safe returnTo, CORS allowlist, login throttling, environment handling, body limits, logs and error responses. Review rather than rewrite other owners’ implementation; send concrete fixes to their handoffs.

5. Run real Mongo integration tests in clean environment, document setup and fail states, and provide a deployment environment checklist with secret names only.

6. Prepare 4-minute presentation segment showing architecture/auth, successful flow and one access-control negative test. Record exact evidence and remaining risks; update own phase status only.

## Acceptance scenarios

- [ ] Real login -> persisted cart merge -> logout does not expose saved cart as guest.
- [ ] A stale auth response after logout/account switch is ignored.
- [ ] Expired session gives a recoverable login path; no infinite retries.
- [ ] Authorization tests pass against deployed/configured server, not just mocked middleware.

## Verification and handoff

1. Run `npm run typecheck`, targeted tests under `tests/member-1`, `npm run check`, and `npm run build`.
2. Run `npm run check:ownership -- --member 1 --base development` and resolve accidental edits. Shared approved changes still require the owner's PR.
3. Run manual desktop/mobile, EN/ES and keyboard checks relevant to the steps above. Backend phase also requires real isolated Mongo API checks; mocks alone do not count.
4. Record commands, exact pass/fail counts, manual observations, dependency blockers, public API compatibility and proposed commit in `phase-4-evidence.md`. Screenshots must use synthetic data, no secrets.
5. Update status.json and handoff.md. Never mark a skipped test passed. Stop before commit/push/merge unless explicitly requested. Do not begin the next phase.

## Demo walkthrough

Show real registration/login, stored identity, protected access, one denied request and secret-safe configuration.

## Stop boundary

Do not add unrequested product scope or silently replace real integrations with fixtures. Final release requires all owners and coordinator checks.
