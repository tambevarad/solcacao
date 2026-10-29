# Student 1 Phase 2 — Core Development

Blueprint execution window: Weeks 3–4. Academic checkpoint mapping: docs/roadmap.md. Read docs/context.md, docs/contracts.md, docs/api.json and your member context first. Preserve owner boundaries.

## Entry conditions

Your prior phase must be integrated and current development synchronized. Use published peer ports; report unavailable dependencies without taking over their code.

## Ordered implementation steps

### Frontend track

1. Inspect auth DTOs and useAuth signatures. Replace auth/mock.ts stubs with a deterministic in-memory registration/login service. Keep synthetic account credentials in memory only, never localStorage. Model duplicate email, bad credentials and a returned role. Use clearly fake tokens that can never authenticate to the backend.

2. Implement AuthProvider state ready/user and login/register/logout. Store token using the common sessionToken export; expose no password state. Keep lifecycle actions out of page components. Confirm CartProvider can observe user changes without AuthProvider importing catalog.

3. Build reusable LoginForm and RegisterForm, route pages and modal wrappers. Share validation and error presentation. Registration offers retail and business options, with companyName appearing and required for business. Do not permit an admin role.

4. Create AccountPage with profile name and company fields plus address list/edit form. Mock persistence lasts for the current tab session. Allow only profile fields in ProfileUpdate. Show current account type clearly.

5. Implement the prewired RequireAuth/RequireRole wrappers in auth/public.tsx without changing existing signatures. Return a login link with safe returnTo for guest; explain lack of business access for retail. Account and wizard route wrappers are already wired in routes.tsx; no Student 2 follow-up edit is needed for those wrappers. Test guards independently and publish the completed behavior in handoff.

6. Create matching auth.* EN/ES keys. Forms preserve input during language switch; password input uses appropriate autocomplete. Pending disables submission; failures keep non-password fields; successful auth resumes a safe internal destination.

7. Exercise logout and page reload to demonstrate memory-only auth. Do not claim sessions persist after refresh. Record deliberate mock behavior and public exports for Students 2, 3 and 4.

### Backend track

1. Implement environment validation and connectDb/disconnectDb in server/shared. Require Mongo URI and a non-placeholder strong JWT secret in HTTP backend mode. Startup must fail clearly if DB is unavailable; health must not claim DB readiness before connection. Keep template/mock frontend independently runnable.

2. Complete and verify the Phase1 User, CorporatePartner and Address schemas with indexes from data-model.md. Normalize unique email; hash password with bcrypt cost 12. Serialize User without hash/private flags. B2B registration must create partner consistently; clean up on failure or document replica-set transaction setup.

3. Implement register/login routes using shared validation and consistent errors/statuses. JWT HS256 issuer/audience/sub/role/expiry per contract. Prevent account enumeration on failed login; map unique-email race to EMAIL_EXISTS. No arbitrary spread of user request into a model.

4. Implement requireAuth, optionalAuth and requireRole ports and Express req.user typing. Verify token then load current user/role. optionalAuth permits no token but rejects a supplied invalid token. Missing auth ->401; retail accessing b2b ->403. Export to peers; do not insert their route logic yourself.

5. Implement me, profile update and own-address routes. A provided address id belonging to another user yields 404. Ignore no unknown privileged fields: reject attempts to change role/passwordHash/userId via profile/address input.

6. Add typed shared error and validation helpers, consistent JSON parser failures and auth rate limits. Preserve already mounted routers. Replace the template GET /products 404 assertion in tests/health.test.ts when Student 3 publishes the real route; assert real health readiness and error handling instead. Never log tokens, passwords, SMTP credentials or whole request bodies.

7. Implement auth/http.ts against exact endpoint paths. All client requests flow through HttpClient. Keep UI components mode-agnostic. Verify direct API calls and HTTP adapter tests without switching everyone to a live backend.

8. Add isolated Mongo integration setup in your owned test directory and provide Student 2 the exact CI Mongo-service patch using TEST_MONGODB_URI; Student 2 owns .github changes. Tests must refuse a production URI. Seed only test accounts; cleanup only test-owned records/database. Update server start/deployment instructions and handoff prerequisites.

## Acceptance scenarios

- [ ] Retail registration -> account; business registration -> company validation -> business account.
- [ ] Duplicate email and incorrect password show recoverable errors without a crash.
- [ ] Required fields, invalid email and 12–72-byte password limits agree with shared schema.
- [ ] Keyboard can enter/submit/close auth modal; focus returns to opener.
- [ ] A fake external returnTo is rejected; existing contracts still typecheck.
- [ ] Register/login round trip with bcrypt verification and no plaintext password/hash leakage.
- [ ] Expired, modified, wrong-audience and missing JWT rejected; wrong role ->403.
- [ ] Two users cannot read/write each other’s addresses.
- [ ] Concurrent same-email registration yields one account and one conflict, not two users.
- [ ] Invalid/malformed body returns standard envelope; database failure is reported truthfully.

## Required verification

Run npm run check and npm run build, plus owned behavior/schema tests and visual review. Phase2 includes real backend validation tests as well as mock frontend interactions. Phase3 requires real Mongo/API tests; mocks do not count. Phase4 requires actual launch evidence. Run npm run check:ownership -- --member 1 --base development. Shared docs/config outside ownership go as exact handoff proposals to the owner.

## Handoff and stop

Update phase-2-evidence.md, handoff.md and status.json using real results. Set ready_for_review only when owned checks pass; only a reviewer records integrated after the actual PR merge. A blocked check remains blocked. Every PR needs visual review, passing unit tests and at least one peer approval. Stop before commit/push/merge/deploy unless the teammate explicitly asks. Never implement the next phase automatically.

## Demo

Show retail and business registration, failed login, successful login, profile/address editing, then logout. Identify mock mode explicitly.
