# Student 1 Phase 3

## Outcome

Complete your validated Express/Mongoose subsystem and matching HTTP adapter with real persistence tests.

## Entry conditions

Phase 2 auth reviewed. Student 1 starts the backend foundation first; publish shared middleware/db signatures before Students 3–5 integrate their routers.

Read your context.md and current status/evidence first. If previous phase is not integrated, explain the dependency; do not silently skip it. Root context.md and docs/contracts.md remain binding.

## Ordered implementation steps

1. Implement environment validation and connectDb/disconnectDb in server/shared. Require Mongo URI and a non-placeholder strong JWT secret in HTTP backend mode. Startup must fail clearly if DB is unavailable; health must not claim DB readiness before connection. Keep template/mock frontend independently runnable.

2. Implement User, CorporatePartner and Address schemas with indexes from data-model.md. Normalize unique email; hash password with bcrypt cost 12. Serialize User without hash/private flags. B2B registration must create partner consistently; clean up on failure or document replica-set transaction setup.

3. Implement register/login routes using shared validation and consistent errors/statuses. JWT HS256 issuer/audience/sub/role/expiry per contract. Prevent account enumeration on failed login; map unique-email race to EMAIL_EXISTS. No arbitrary spread of user request into a model.

4. Implement requireAuth, optionalAuth and requireRole ports and Express req.user typing. Verify token then load current user/role. optionalAuth permits no token but rejects a supplied invalid token. Missing auth ->401; retail accessing b2b ->403. Export to peers; do not insert their route logic yourself.

5. Implement me, profile update and own-address routes. A provided address id belonging to another user yields 404. Ignore no unknown privileged fields: reject attempts to change role/passwordHash/userId via profile/address input.

6. Add typed shared error and validation helpers, consistent JSON parser failures and auth rate limits. Preserve already mounted routers. Never log tokens, passwords, SMTP credentials or whole request bodies.

7. Implement auth/http.ts against exact endpoint paths. All client requests flow through HttpClient. Keep UI components mode-agnostic. Verify direct API calls and HTTP adapter tests without switching everyone to a live backend.

8. Add isolated Mongo integration setup and a CI Mongo service with TEST_MONGODB_URI; tests must refuse a production URI. Seed only test accounts; cleanup only test-owned records/database. Update server start/deployment instructions and handoff prerequisites.

## Acceptance scenarios

- [ ] Register/login round trip with bcrypt verification and no plaintext password/hash leakage.
- [ ] Expired, modified, wrong-audience and missing JWT rejected; wrong role ->403.
- [ ] Two users cannot read/write each other’s addresses.
- [ ] Concurrent same-email registration yields one account and one conflict, not two users.
- [ ] Invalid/malformed body returns standard envelope; database failure is reported truthfully.

## Verification and handoff

1. Run `npm run typecheck`, targeted tests under `tests/member-1`, `npm run check`, and `npm run build`.
2. Run `npm run check:ownership -- --member 1 --base development` and resolve accidental edits. Shared approved changes still require the owner's PR.
3. Run manual desktop/mobile, EN/ES and keyboard checks relevant to the steps above. Backend phase also requires real isolated Mongo API checks; mocks alone do not count.
4. Record commands, exact pass/fail counts, manual observations, dependency blockers, public API compatibility and proposed commit in `phase-3-evidence.md`. Screenshots must use synthetic data, no secrets.
5. Update status.json and handoff.md. Never mark a skipped test passed. Stop before commit/push/merge unless explicitly requested. Do not begin the next phase.

## Demo walkthrough

Use REST requests to create both roles, log in, fetch me, update profile/address, and demonstrate 401/403/ownership rejection. Show saved records with hashes redacted.

## Stop boundary

Do not redesign completed UI, change DTOs unilaterally or claim final integration/deployment. Supply working API evidence and adapter.

Template test transition: update tests/health.test.ts when real routes land. Replace the template-only products404 assertion with health/readiness/error assertions; do not keep asserting a required feature is missing.
