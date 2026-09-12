# Student 2 Phase 3

## Outcome

Complete your validated Express/Mongoose subsystem and matching HTTP adapter with real persistence tests.

## Entry conditions

Shell/frontend Phase 2 reviewed; feature dictionaries exist. Student 1 owns shared backend runtime and middleware.

Read your context.md and current status/evidence first. If previous phase is not integrated, explain the dependency; do not silently skip it. Root context.md and docs/contracts.md remain binding.

## Ordered implementation steps

1. Implement GET /api/i18n/:locale returning combined dictionaries with exact envelope. Validate locale and ensure generated deployment contains the JSON files or compiled dictionary module. Add a build step or explicit JSON imports that work from dist, not source-only path guesses.

2. Implement public static asset routing templates for approved brand/product files. Keep Student 4 private uploads completely separate. Coordinate the Express app mount with Student 1; do not take over server bootstrap ownership.

3. Implement shell/http.ts dictionary via common client. Test both languages and malformed locale. Do not switch the app-wide mode until Phase 4 readiness.

4. Expand docs/api.json/README setup with the implemented dictionary/asset behavior if no contract change; for signature changes follow review procedure. Keep all five adapter paths/imports stable.

5. Review integration CI with Student 1: typecheck and build remain global; Mongo API tests run separately from mock UI. Ensure package-lock changes are intentional and explain each dependency addition.

6. Run whole-project build with current peer branches merged through PR. Record unresolved feature blockers instead of hiding them behind dummy dictionary/API values.

## Acceptance scenarios

- [ ] Both dictionaries load from running compiled backend after a clean build.
- [ ] Invalid locale returns 400; frontend handles request failure.
- [ ] Private upload path cannot be reached through public static route.
- [ ] Mock and HTTP dictionary DTOs have identical key/value shapes.

## Verification and handoff

1. Run `npm run typecheck`, targeted tests under `tests/member-2`, `npm run check`, and `npm run build`.
2. Run `npm run check:ownership -- --member 2 --base development` and resolve accidental edits. Shared approved changes still require the owner's PR.
3. Run manual desktop/mobile, EN/ES and keyboard checks relevant to the steps above. Backend phase also requires real isolated Mongo API checks; mocks alone do not count.
4. Record commands, exact pass/fail counts, manual observations, dependency blockers, public API compatibility and proposed commit in `phase-3-evidence.md`. Screenshots must use synthetic data, no secrets.
5. Update status.json and handoff.md. Never mark a skipped test passed. Stop before commit/push/merge unless explicitly requested. Do not begin the next phase.

## Demo walkthrough

Fetch both locale endpoints from API and demonstrate a public asset; show compiled build instructions.

## Stop boundary

Do not redesign completed UI, change DTOs unilaterally or claim final integration/deployment. Supply working API evidence and adapter.
