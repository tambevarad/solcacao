# B2B client

Owner: Student 4. See `team/member-4/context.md`. The API side is in
`server/src/features/b2b/README.md`.

## Pages (paths fixed by `client/src/routes.tsx`)

| Route                        | Page              | Data                                                         |
| ---------------------------- | ----------------- | ------------------------------------------------------------ |
| `/:locale`                   | `HomePage`        | `api.catalog.list({ limit: 4, sort: 'name', locale })`       |
| `/:locale/wholesale`         | `WholesalePage`   | none                                                         |
| `/:locale/wholesale/request` | `QuoteWizardPage` | `api.b2b.submit(input, file)`; Student 1's `RequireRole b2b` |

In HTTP mode `api.b2b.submit` (`http.ts`) posts `multipart/form-data` to `POST /api/b2b/quote`: one
`metadata` field (the `QuoteInput` JSON) and one `designFile`. The shared transport adds the bearer
token and unwraps `{ data }`. Mock mode (`mock.ts`) simulates the same receipts in the browser and
says so on screen.

## Quote wizard

- **Four steps** (`wizard.ts`): cacao and quantity, branding PDF, packaging and contact, review. Each
  step validates its own fields; the server repeats every check.
- **Where the draft lives** (`draftStore.ts`): in this browser tab's memory, outside the page, for
  the signed-in account only.
  - It survives a language switch, a visit to another page, and the end of the one-hour session. In
    that last case Student 1's `RequireRole` replaces the wizard with a sign-in prompt; signing in
    again with the same account brings back the step, the answers and the chosen PDF, with a note
    and a "Start over" button.
  - Signing in as another account starts an empty wizard and discards the previous draft. A page
    reload clears everything, including the file. Nothing is written to browser storage.
- **Retries:** the exact payload of an unconfirmed attempt is kept, so "Try sending again" resends
  the same `requestId` and file and the server returns the original receipt instead of a duplicate.
  Any edit starts a new request with a new `requestId`.
- **Refused session (401):** the draft is kept and the page calls `logout()`, so the guard asks for
  sign-in instead of retrying; the unsent attempt is sent unchanged afterwards.
- **A request that finishes after the page went away** (for example, the session ended during the
  upload) is applied to the kept draft, so the receipt shows when the page comes back. Results for a
  draft that was discarded meanwhile are ignored.
- **Receipt:** the reference, the time and the notification result exactly as the server reports
  it (`sent`, `failed` or `pending`). A failed email says the request is saved and need not be sent
  again.

## Images

- Photos come from the shared library (`client/src/shared/photos.ts`, Student 2).
- Only the first hero photo loads with the page (`priority`).
- Photos further down use `DeferredPhoto`, which mounts the shared `<Photo>` only within 600 px of
  the viewport. The browser's own `loading="lazy"` threshold is wider than these pages, so it used
  to fetch every photo at once.
- The hidden hero slides mount 2 s after the page's `load` event while slides rotate, or when the
  visitor changes slide. With reduced motion and no slide changes, they never load.
- The featured products keep their grid's size while loading, so nothing below moves.
- Measurements are in `team/member-4/phase-4-evidence.md`.

## Tests

- **`tests/member-4`, Vitest:**
  - `wizard.test.tsx`: steps, files, language switch, retries, and the kept draft;
  - `images.test.tsx`: deferred photos, hero preload and the loading skeleton;
  - `pages.test.tsx`, `guard.test.tsx`, `fail-closed.test.tsx`, `adapters.test.ts`, `i18n.test.ts`.
- **`tests/member-4/quote-journey.live.spec.ts`, Playwright against the live API:** run with
  `npx playwright test --config tests/member-4/playwright.config.ts` after starting the compiled API
  as CI's `e2e-live` job does.

## Known limits

- The draft is lost on a full reload; the session token is in memory too, so a reload also signs
  out.
- A business buyer cannot download their PDF or reopen a receipt from the UI: `B2bApi` only has
  `submit`. The owner-only `GET /api/b2b/quotes/:id` and `/file` routes work through the API, and a
  contract proposal is in `team/member-4/handoff.md`.
- Product photos are illustrative CC0 stock for fictional products, not photographs of real
  SolCacao products.
