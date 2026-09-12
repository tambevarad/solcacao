# Student 2 Phase 4

## Outcome

Prove your feature works in the integrated HTTP application and supply final deployment/demo evidence.

## Entry conditions

All five Phase 3 implementations reviewed; shared middleware, catalog, notifications and quote APIs available.

Read your context.md and current status/evidence first. If previous phase is not integrated, explain the dependency; do not silently skip it. Root context.md and docs/contracts.md remain binding.

## Ordered implementation steps

1. Coordinate integration in order specified in docs/integration.md. Switch VITE_API_MODE=http in deployment/test configuration, not hardcoded feature code. Display mock mode only in development evidence; never auto-fallback after network error.

2. Run all cross-feature scenarios with owners present or their evidence: login/cart merge, bilingual wizard with file, sampler inquiry, contact notification, guest checkout. File owner fixes to owning member; only change shared wiring yourself.

3. Add browser end-to-end tests using live API and isolated Mongo in CI; deterministic seeds and SMTP test sink. Keep mock Phase 2 checks separate and labeled. Replace the template scaffold assertion when HomePage is implemented.

4. Complete route metadata, image loading, keyboard/responsive/contrast audit and translation parity. Optimize actual oversized assets/slow queries with owners, record measured results and avoid unsupported performance claims.

5. Implement production serving/run configuration from docs/deployment.md: API routes precede SPA fallback, deep links refresh, private uploads remain private, environment variables correct. Deploy only when user/team has authorized target and secrets/budget are supplied; produce build and checklist first.

6. Complete README and deployment evidence using exact commands verified from fresh checkout. Fill actual host URL and diagnostics without secrets. Configure branch protection/CODEOWNERS once real handles known and provider supports them; report unsupported enforcement.

7. Assemble 20–30 minute team presentation outline, assign time slots, confirm demo data, gather all phase handoffs. Phase acceptance requires all five reviews/tests; do not equate coordinator status with other members’ completion.

## Acceptance scenarios

- [ ] Deep-link refresh /es/products/... and /en/wholesale/request works in deployed environment.
- [ ] HTTP mode never calls mock implementations; a stopped API shows error UI.
- [ ] Full journey tests pass with live Mongo and SMTP sink.
- [ ] No EN-only controls, overflow, inaccessible drawers or placeholder routes remain in final submission.

## Verification and handoff

1. Run `npm run typecheck`, targeted tests under `tests/member-2`, `npm run check`, and `npm run build`.
2. Run `npm run check:ownership -- --member 2 --base development` and resolve accidental edits. Shared approved changes still require the owner's PR.
3. Run manual desktop/mobile, EN/ES and keyboard checks relevant to the steps above. Backend phase also requires real isolated Mongo API checks; mocks alone do not count.
4. Record commands, exact pass/fail counts, manual observations, dependency blockers, public API compatibility and proposed commit in `phase-4-evidence.md`. Screenshots must use synthetic data, no secrets.
5. Update status.json and handoff.md. Never mark a skipped test passed. Stop before commit/push/merge unless explicitly requested. Do not begin the next phase.

## Demo walkthrough

Open live app, show end-to-end flows, explain architecture/integration, and present team evidence for 20–30 minutes total.

## Stop boundary

Do not add unrequested product scope or silently replace real integrations with fixtures. Final release requires all owners and coordinator checks.
