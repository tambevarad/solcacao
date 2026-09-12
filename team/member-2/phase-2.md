# Student 2 Phase 2 — Core Development

Blueprint execution window: Weeks 3–4. Academic checkpoint mapping: docs/roadmap.md. Read context.md, docs/contracts.md, docs/api.json and your member context first. Preserve owner boundaries.

## Entry conditions

Your prior phase must be integrated and current development synchronized. Use published peer ports; report unavailable dependencies without taking over their code.

## Ordered implementation steps

### Frontend track

1. Implement shared Button/Field/Select and accessible dialog/drawer primitives under shared with standard HTML props. Export a documented stable surface and examples. Avoid framework replacement or utility abstraction churn.

2. Build Layout with sticky header, brand placeholder, semantic nav, search trigger, account entry, dynamic cart count and footer. Read count/open from useCart; do not implement a second cart. Search submits to catalog query parameter search, preserving locale.

3. Build mobile navigation drawer with focus trap/restore, Escape and scroll lock. Keep mobile and desktop links generated from one navigation definition. Account links depend on useAuth; request auth modal exports from Student 1 rather than duplicating forms.

4. Implement LocaleProvider; combine all five feature EN/ES dictionaries through explicit imports. setLocale changes URL prefix with same path/query and keeps mounted feature state. Validate en/es, set document language, handle missing keys visibly in development. Match key sets in tests.

5. Wire canonical routes, error/not-found page and safe fallback for unknown locale. Keep the prewired account/b2b wrappers; Student 1 implements their behavior through the existing public exports. Maintain mock stubs until peers merge, never implement their pages.

6. Implement shell/mock.ts dictionary service and use it through api.shell, preserving the future HTTP signature. Keep loading/error recovery functional if dictionary loading fails; no silent missing translations.

7. Create footer/info navigation and consistent title/description update mechanism for all routes. Do not add business addresses/phone numbers that were not supplied.

8. Run desktop/mobile accessibility checks on shell, publish shared component API and merge foundation PR early so peers can adopt it. Then integrate peer pages by PR without redesigning their internals.

### Backend track

1. Implement GET /api/i18n/:locale returning combined dictionaries with exact envelope. Validate locale and ensure generated deployment contains the JSON files or compiled dictionary module. Add a build step or explicit JSON imports that work from dist, not source-only path guesses.

2. Implement public static asset routing templates for approved brand/product files. Keep Student 4 private uploads completely separate. Coordinate the Express app mount with Student 1; do not take over server bootstrap ownership.

3. Implement shell/http.ts dictionary via common client. Test both languages and malformed locale. Do not switch the app-wide mode until Phase 3 readiness.

4. Expand docs/api.json/README setup with the implemented dictionary/asset behavior if no contract change; for signature changes follow review procedure. Keep all five adapter paths/imports stable.

5. Review integration CI with Student 1: typecheck and build remain global; Mongo API tests run separately from mock UI. Ensure package-lock changes are intentional and explain each dependency addition.

6. Run whole-project build with current peer branches merged through PR. Record unresolved feature blockers instead of hiding them behind dummy dictionary/API values.

## Acceptance scenarios

- [ ] Navigation and search produce canonical localized URLs; browser back works.
- [ ] EN->ES on product and wizard retains path/query/state.
- [ ] Navbar count reads same cart state as drawer.
- [ ] 375/768/1440 widths have no overflow; keyboard drawer focus trapped and restored.
- [ ] Duplicate/missing translation keys fail tests; unsupported prefix not silently accepted.
- [ ] Both dictionaries load from running compiled backend after a clean build.
- [ ] Invalid locale returns 400; frontend handles request failure.
- [ ] Private upload path cannot be reached through public static route.
- [ ] Mock and HTTP dictionary DTOs have identical key/value shapes.

## Required verification

Run npm run check and npm run build, plus owned behavior/schema tests and visual review. Phase2 includes real backend validation tests as well as mock frontend interactions. Phase3 requires real Mongo/API tests; mocks do not count. Phase4 requires actual launch evidence. Run npm run check:ownership -- --member 2 --base development. Shared docs/config outside ownership go as exact handoff proposals to the owner.

## Handoff and stop

Update phase-2-evidence.md, handoff.md and status.json using real results. Set ready_for_review only when owned checks pass; only a reviewer records integrated after the actual PR merge. A blocked check remains blocked. Every PR needs visual review, passing unit tests and at least one peer approval. Stop before commit/push/merge/deploy unless the teammate explicitly asks. Never implement the next phase automatically.

## Demo

Navigate all pages, resize, operate mobile drawer/search/cart entry, switch EN/ES, demonstrate unknown route and keyboard access.

## Scaffold test transition

When Student 4 publishes the homepage, replace the placeholder HomePage browser assertion in tests/e2e with the real homepage landmark and navigation checks. Do not retain placeholder expectations or delete behavior coverage to make CI green.
