# Student 2 Phase 2

## Outcome

Complete your responsive React interaction flow using the typed mock API; no live backend required.

## Entry conditions

Existing route/provider/API scaffolding compiles. Other owners will progressively supply their feature pages and dictionaries.

Read your context.md and current status/evidence first. If previous phase is not integrated, explain the dependency; do not silently skip it. Root context.md and docs/contracts.md remain binding.

## Ordered implementation steps

1. Implement shared Button/Field/Select and accessible dialog/drawer primitives under shared with standard HTML props. Export a documented stable surface and examples. Avoid framework replacement or utility abstraction churn.

2. Build Layout with sticky header, brand placeholder, semantic nav, search trigger, account entry, dynamic cart count and footer. Read count/open from useCart; do not implement a second cart. Search submits to catalog query parameter search, preserving locale.

3. Build mobile navigation drawer with focus trap/restore, Escape and scroll lock. Keep mobile and desktop links generated from one navigation definition. Account links depend on useAuth; request auth modal exports from Student 1 rather than duplicating forms.

4. Implement LocaleProvider; combine all five feature EN/ES dictionaries through explicit imports. setLocale changes URL prefix with same path/query and keeps mounted feature state. Validate en/es, set document language, handle missing keys visibly in development. Match key sets in tests.

5. Wire canonical routes, error/not-found page and safe fallback for unknown locale. Keep the prewired account/b2b wrappers; Student 1 implements their behavior through the existing public exports. Maintain mock stubs until peers merge, never implement their pages.

6. Implement shell/mock.ts dictionary service and use it through api.shell, preserving the future HTTP signature. Keep loading/error recovery functional if dictionary loading fails; no silent missing translations.

7. Create footer/info navigation and consistent title/description update mechanism for all routes. Do not add business addresses/phone numbers that were not supplied.

8. Run desktop/mobile accessibility checks on shell, publish shared component API and merge foundation PR early so peers can adopt it. Then integrate peer pages by PR without redesigning their internals.

## Acceptance scenarios

- [ ] Navigation and search produce canonical localized URLs; browser back works.
- [ ] EN->ES on product and wizard retains path/query/state.
- [ ] Navbar count reads same cart state as drawer.
- [ ] 375/768/1440 widths have no overflow; keyboard drawer focus trapped and restored.
- [ ] Duplicate/missing translation keys fail tests; unsupported prefix not silently accepted.

## Verification and handoff

1. Run `npm run typecheck`, targeted tests under `tests/member-2`, `npm run check`, and `npm run build`.
2. Run `npm run check:ownership -- --member 2 --base development` and resolve accidental edits. Shared approved changes still require the owner's PR.
3. Run manual desktop/mobile, EN/ES and keyboard checks relevant to the steps above. Backend phase also requires real isolated Mongo API checks; mocks alone do not count.
4. Record commands, exact pass/fail counts, manual observations, dependency blockers, public API compatibility and proposed commit in `phase-2-evidence.md`. Screenshots must use synthetic data, no secrets.
5. Update status.json and handoff.md. Never mark a skipped test passed. Stop before commit/push/merge unless explicitly requested. Do not begin the next phase.

## Demo walkthrough

Navigate all pages, resize, operate mobile drawer/search/cart entry, switch EN/ES, demonstrate unknown route and keyboard access.

## Stop boundary

Do not implement Mongoose models, production JWT/SMTP/file storage or live backend routes in this phase. All mock behavior must be disclosed.
