# Student 4 handoff

Current phase: 2 (Core Development), ready for review on `krish-b2b`. Evidence:
`team/member-4/phase-2-evidence.md`.

## Public exports delivered

- **Pages** (paths and default exports unchanged, so `routes.tsx` needs no edit): `HomePage`,
  `WholesalePage`, `QuoteWizardPage`. Each accepts an optional test seam prop; the app passes none.
- **Client adapters:** `createMockB2B(http, options?)` (`identity`, `scenario`, `now`, `delayMs`)
  and `createHttpB2B(http)`, both implementing `B2bApi`.
- **Server:** `b2bRouter` (already mounted by `app.ts`), `createB2bRouter(deps)`,
  `authenticationPending`, `notificationPending`, `B2bRequest` model, `createLocalQuoteStorage(root)`.
- **Routes:** `POST /api/b2b/quote`, `GET /api/b2b/quotes/:id`, `GET /api/b2b/quotes/:id/file`
  (details in `server/src/features/b2b/README.md`).
- **Dev-only knob (mock mode):** `VITE_B2B_MOCK_SCENARIO=fail-first|notification-failed` to demo
  error recovery and a failed notification.

## Required peer exports and PRs

- **Student 1:**
  - `RequireRole role="b2b"` UX on `/:locale/wholesale/request` (already wired in `routes.tsx`):
    guest → `/:locale/login` with a return to the wizard; retail → explanation with a link to create a
    business account; b2b → the wizard. The page adds no guard of its own.
  - Auth mock: the B2B mock calls `createMockAuth(http).me()` at submit time. Per the contract the
    registry and session must be shared module state; `me()` should throw `ApiError(401,
'UNAUTHORIZED')` when signed out.
  - `useAuth().user.companyName` and `email` are used to prefill step 3.
  - Server: `requireAuth` and `requireRole(role)` in `server/src/shared/auth.ts` with the `req.user`
    augmentation, and `connectDb` at startup. After that merges, Student 4 wires them in a follow-up
    PR (own files only) and deletes `server/src/features/b2b/types.ts`'s duplicate augmentation:

    ```ts
    import { requireAuth, requireRole } from '../../shared/auth.js';
    export const b2bRouter = createB2bRouter({
      requireAuth,
      requireB2b: requireRole('b2b'),
      notifyQuote, // Student 5
      storage: createLocalQuoteStorage(process.env.UPLOAD_DIR || 'server/storage'),
    });
    ```

  - CI: a MongoDB service exporting `TEST_MONGODB_URI`, so `tests/member-4/quote-persistence.test.ts`
    runs in CI instead of being skipped.
- **Student 3:** `api.catalog.list({ limit: 4, sort: 'name', locale })` feeds homepage featured
  products. The homepage links `/catalog?category=bar|truffle|seasonal` (existing ProductQuery keys)
  and shows the existing `/placeholders/{bar,truffle,seasonal}.svg` fixture art on collection tiles.
- **Student 5:** `notifyQuote({ quoteId, companyName, contactEmail, locale })` returning
  `'sent' | 'failed'` in `server/src/features/support/notifications.ts`. It is called once, after the
  request is saved; no file contents are passed. The homepage links `/story` and `/sampler`.
- **Student 2:** see proposals 1–3 below.

## Shared change proposals

1. **Student 2, `tests/member-2` (blocks `npm run check` on this branch).** Four tests use `/en` as a
   generic route and assert the HomePage placeholder (`heading "HomePage"`, text "Placeholder") and a
   single `role="status"` on the page. Phase 2 requires replacing the placeholder, and the real
   homepage has its own polite status regions (shared `LoadingState`). Proposed exact patch; with it
   applied the whole suite passes (145 passed, 10 Mongo tests skipped). Consumers: tests only;
   migration: none. Please merge it with or before this PR.

   ```diff
   --- a/tests/member-2/cart-integration.test.tsx
   +++ b/tests/member-2/cart-integration.test.tsx
   @@ -5 +5 @@
   -import { cleanup, fireEvent, screen } from '@testing-library/react';
   +import { cleanup, fireEvent, screen, within } from '@testing-library/react';
   @@ -39 +39 @@
   -  expect(screen.getByRole('status')).toBeEmptyDOMElement();
   +  expect(within(screen.getByRole('banner')).getByRole('status')).toBeEmptyDOMElement();
   --- a/tests/member-2/shell.test.tsx
   +++ b/tests/member-2/shell.test.tsx
   @@ -48 +48 @@
   -    expect(await screen.findByRole('heading', { name: 'HomePage' })).toBeInTheDocument();
   +    expect(await screen.findByRole('navigation', { name: 'Main' })).toBeInTheDocument();
   @@ -57 +56,0 @@
   -    expect(screen.getByText('Placeholder')).toBeInTheDocument();
   @@ -162 +161 @@
   -    expect(await screen.findByRole('heading', { name: 'HomePage' })).toBeInTheDocument();
   +    expect(await screen.findByRole('navigation', { name: 'Main' })).toBeInTheDocument();
   @@ -218 +217,3 @@
   -    expect(screen.getByRole('status')).toHaveTextContent('The cart drawer is not available yet.');
   +    expect(within(screen.getByRole('banner')).getByRole('status')).toHaveTextContent(
   +      'The cart drawer is not available yet.',
   +    );
   ```

2. **Student 2, `tests/e2e`.** Once Student 1's RequireRole lands: a B2B journey spec (wholesale →
   start → business sign-in → four steps with a synthetic PDF → switch to ES at step 3 → mock receipt),
   and `/en/wholesale` added to the overflow page list. Student 4 can draft the spec text on request.
3. **Student 2, `.env.example`.** Add a commented dev-only line:
   `# VITE_B2B_MOCK_SCENARIO=success   # success | fail-first | notification-failed (mock mode only)`.
4. **Coordinator note.** `context.md` ("Phase 2: … no MongoDB") conflicts with
   `team/member-4/phase-2.md`, `docs/roadmap.md` and `docs/integration.md`, which put the backend track
   in Phase 2 with injected ports. This branch follows the phase file; consider aligning `context.md`.

## Known limitations and next step

- Wizard route closed until Student 1's guard; mock submission blocked until Student 1's auth mock.
- Backend fails closed (401) until Student 1's middleware; notifications report `failed` until
  Student 5's bridge; featured products pending until Student 3's catalog API.
- Persistence tests skipped in CI until a Mongo service exists; they pass locally with Docker Mongo.
- Draft is in memory only; a reload requires starting over and choosing the file again.
- Real photography and copy are not supplied; image slots are labeled.
- Phase 1 status for member 4 is still `not_started` (D21); the member should record it truthfully.
- Next: wire Student 1/5 ports when merged; Phase 3 binds the UI to the real HTTP adapter.
