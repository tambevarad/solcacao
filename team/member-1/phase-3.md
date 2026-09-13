# Student 1 Phase 3 — Integration & API Bind

Blueprint execution window: Weeks 5–6. Academic checkpoint mapping: docs/roadmap.md. Read context.md, docs/contracts.md, docs/api.json and your member context first. Preserve owner boundaries.

## Entry conditions

Your prior phase must be integrated and current development synchronized. Use published peer ports; report unavailable dependencies without taking over their code.

## Ordered implementation steps

1. Test login/register through the real UI with VITE_API_MODE=http. Verify token becomes available before the cart merge call; no duplicate requests from StrictMode create duplicate accounts or carts.

2. Integrate account/addresses and error translation. Verify reload prompts login according to the memory-token design, logout clears local identity, and an in-flight request cannot restore a logged-out user.

3. Exercise guest/retail/business entry to quote wizard together with Student 4; verify the backend still blocks unauthorized direct POST/file retrieval even when UI guards are bypassed.

4. Review JWT expiry UX, safe returnTo, CORS allowlist, login throttling, environment handling, body limits, logs and error responses. Review rather than rewrite other owners’ implementation; send concrete fixes to their handoffs.

5. Run real Mongo integration tests in clean environment, document setup and fail states, and provide a deployment environment checklist with secret names only.

6. Prepare 4-minute presentation segment showing architecture/auth, successful flow and one access-control negative test. Record exact evidence and remaining risks; update own phase status only.

Integration emphasis: complete React-to-Express binding now (Weeks5–6), not in Phase4. Audit database-trigger needs: record that no triggers are specified, verify equivalent service/atomic-write logic, and do not invent triggers. Perform security code sweeps and verify every ES/EN translation map. Any launch/presentation preparation mentioned above may be drafted now; deployment/final sign-off remains Phase4.

## Acceptance scenarios

- [ ] Real login -> persisted cart merge -> logout does not expose saved cart as guest.
- [ ] A stale auth response after logout/account switch is ignored.
- [ ] Expired session gives a recoverable login path; no infinite retries.
- [ ] Authorization tests pass against real configured server, not just mocked middleware.
- [ ] Real API binding, security sweep, trigger audit and ES/EN audit complete.

## Required verification

Run npm run check and npm run build, plus owned behavior/schema tests and visual review. Phase2 includes real backend validation tests as well as mock frontend interactions. Phase3 requires real Mongo/API tests; mocks do not count. Phase4 requires actual launch evidence. Run npm run check:ownership -- --member 1 --base development. Shared docs/config outside ownership go as exact handoff proposals to the owner.

## Handoff and stop

Update phase-3-evidence.md, handoff.md and status.json using real results. Set ready_for_review only when owned checks pass; only a reviewer records integrated after the actual PR merge. A blocked check remains blocked. Every PR needs visual review, passing unit tests and at least one peer approval. Stop before commit/push/merge/deploy unless the teammate explicitly asks. Never implement the next phase automatically.

## Demo

Use REST requests to create both roles, log in, fetch me, update profile/address, and demonstrate 401/403/ownership rejection. Show saved records with hashes redacted.
