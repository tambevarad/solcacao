# Student 1 Phase 2

## Outcome

Complete your responsive React interaction flow using the typed mock API; no live backend required.

## Entry conditions

Mock-mode frontend; root token and provider interfaces exist. Do not depend on a running API or MongoDB.

Read your context.md and current status/evidence first. If previous phase is not integrated, explain the dependency; do not silently skip it. Root context.md and docs/contracts.md remain binding.

## Ordered implementation steps

1. Inspect auth DTOs and useAuth signatures. Replace auth/mock.ts stubs with a deterministic in-memory registration/login service. Keep synthetic account credentials in memory only, never localStorage. Model duplicate email, bad credentials and a returned role. Use clearly fake tokens that can never authenticate to the backend.

2. Implement AuthProvider state ready/user and login/register/logout. Store token using the common sessionToken export; expose no password state. Keep lifecycle actions out of page components. Confirm CartProvider can observe user changes without AuthProvider importing catalog.

3. Build reusable LoginForm and RegisterForm, route pages and modal wrappers. Share validation and error presentation. Registration offers retail and business options, with companyName appearing and required for business. Do not permit an admin role.

4. Create AccountPage with profile name and company fields plus address list/edit form. Mock persistence lasts for the current tab session. Allow only profile fields in ProfileUpdate. Show current account type clearly.

5. Implement the prewired RequireAuth/RequireRole wrappers in auth/public.tsx without changing existing signatures. Return a login link with safe returnTo for guest; explain lack of business access for retail. Account and wizard route wrappers are already wired in routes.tsx; no Student 2 follow-up edit is needed for those wrappers. Test guards independently and publish the completed behavior in handoff.

6. Create matching auth.* EN/ES keys. Forms preserve input during language switch; password input uses appropriate autocomplete. Pending disables submission; failures keep non-password fields; successful auth resumes a safe internal destination.

7. Exercise logout and page reload to demonstrate memory-only auth. Do not claim sessions persist after refresh. Record deliberate mock behavior and public exports for Students 2, 3 and 4.

## Acceptance scenarios

- [ ] Retail registration -> account; business registration -> company validation -> business account.
- [ ] Duplicate email and incorrect password show recoverable errors without a crash.
- [ ] Required fields, invalid email and 12–72-byte password limits agree with shared schema.
- [ ] Keyboard can enter/submit/close auth modal; focus returns to opener.
- [ ] A fake external returnTo is rejected; existing contracts still typecheck.

## Verification and handoff

1. Run `npm run typecheck`, targeted tests under `tests/member-1`, `npm run check`, and `npm run build`.
2. Run `npm run check:ownership -- --member 1 --base development` and resolve accidental edits. Shared approved changes still require the owner's PR.
3. Run manual desktop/mobile, EN/ES and keyboard checks relevant to the steps above. Backend phase also requires real isolated Mongo API checks; mocks alone do not count.
4. Record commands, exact pass/fail counts, manual observations, dependency blockers, public API compatibility and proposed commit in `phase-2-evidence.md`. Screenshots must use synthetic data, no secrets.
5. Update status.json and handoff.md. Never mark a skipped test passed. Stop before commit/push/merge unless explicitly requested. Do not begin the next phase.

## Demo walkthrough

Show retail and business registration, failed login, successful login, profile/address editing, then logout. Identify mock mode explicitly.

## Stop boundary

Do not implement Mongoose models, production JWT/SMTP/file storage or live backend routes in this phase. All mock behavior must be disclosed.
