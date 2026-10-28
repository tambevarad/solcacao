# Student 2 Phase 3 — Integration & API Bind

Blueprint execution window: Weeks 5–6. Academic checkpoint mapping: docs/roadmap.md. Read docs/context.md, docs/contracts.md, docs/api.json and your member context first. Preserve owner boundaries.

## Entry conditions

Your prior phase must be integrated and current development synchronized. Use published peer ports; report unavailable dependencies without taking over their code.

## Ordered implementation steps

1. Coordinate integration in order specified in docs/integration.md. Switch VITE_API_MODE=http in deployment/test configuration, not hardcoded feature code. Display mock mode only in development evidence; never auto-fallback after network error.

2. Run all cross-feature scenarios with owners present or their evidence: login/cart merge, bilingual wizard with file, sampler inquiry, contact notification, guest checkout. File owner fixes to owning member; only change shared wiring yourself.

3. Add browser end-to-end tests using live API and isolated Mongo in CI; deterministic seeds and SMTP test sink. Keep mock Phase 2 checks separate and labeled. Replace the template scaffold assertion when HomePage is implemented.

4. Complete route metadata, image loading, keyboard/responsive/contrast audit and translation parity. Measure oversized assets/slow queries with owners and record the Phase 4 optimization backlog.

5. Implement production serving/run configuration from docs/deployment.md: API routes precede SPA fallback, deep links refresh, private uploads remain private, environment variables correct. Verify the compiled configuration locally; prepare the deployment checklist. Actual cloud launch belongs to Phase 4.

6. Complete README and deployment evidence using exact commands verified from fresh checkout. Record verified local integration commands and diagnostics without secrets. Verify the protections/CODEOWNERS established in Phase 1 still apply; report unsupported enforcement. Add the live host in Phase 4.

7. Assemble 20–30 minute team presentation outline, assign time slots, confirm demo data, gather all phase handoffs. Phase acceptance requires all five reviews/tests; do not equate coordinator status with other members’ completion.

Integration emphasis: complete React-to-Express binding now (Weeks5–6), not in Phase4. Audit database-trigger needs: record that no triggers are specified, verify equivalent service/atomic-write logic, and do not invent triggers. Perform security code sweeps and verify every ES/EN translation map. Any launch/presentation preparation mentioned above may be drafted now; deployment/final sign-off remains Phase4.

## Acceptance scenarios

- [ ] Deep-link refresh /es/products/... and /en/wholesale/request works in the compiled integration environment.
- [ ] HTTP mode never calls mock implementations; a stopped API shows error UI.
- [ ] Full journey tests pass with live Mongo and SMTP sink.
- [ ] No EN-only controls, overflow, inaccessible drawers or placeholder routes remain in integrated routes.
- [ ] Real API binding, security sweep, trigger audit and ES/EN audit complete.

## Required verification

Run npm run check and npm run build, plus owned behavior/schema tests and visual review. Phase2 includes real backend validation tests as well as mock frontend interactions. Phase3 requires real Mongo/API tests; mocks do not count. Phase4 requires actual launch evidence. Run npm run check:ownership -- --member 2 --base development. Shared docs/config outside ownership go as exact handoff proposals to the owner.

## Handoff and stop

Update phase-3-evidence.md, handoff.md and status.json using real results. Set ready_for_review only when owned checks pass; only a reviewer records integrated after the actual PR merge. A blocked check remains blocked. Every PR needs visual review, passing unit tests and at least one peer approval. Stop before commit/push/merge/deploy unless the teammate explicitly asks. Never implement the next phase automatically.

## Demo

Fetch both locale endpoints from API and demonstrate a public asset; show compiled build instructions.
