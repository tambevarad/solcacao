# Final presentation plan (Phase 4)

A 25-minute face-to-face demo of the deployed site, inside the 20–30 minutes in `docs/submissions.md`. The slots follow the suggested allocation there, and each member's slot is their own segment draft in `team/member-N/phase-4-evidence.md`. Varad shares the screen and drives; each member speaks to their own slot and says what to click.

Site: https://solcacao-production.up.railway.app (real API, MongoDB, private uploads, Mailpit). Every product, company and account is fictional. Retail checkout is simulated by design: no payment is taken (a scope default, say it once in the overview).

## Running order

| Time        | Speaker  | Segment                                    | Shown live                                                                                                                                                               |
| ----------- | -------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0:00–3:00   | Varad    | Overview and architecture                  | The homepage in EN and ES; one diagram: React build served by Express, MongoDB, private volume, Mailpit; one PR per member, reviewed, and CI with live-API browser tests |
| 3:00–7:00   | Aman     | Accounts and security (4 min)              | Guest cart, register, merge with the new token, profile and address, reload asks for sign-in; a retail account refused the quote wizard, and the API's 403 and 401       |
| 7:00–12:00  | Reethika | Catalog, cart and checkout (5 min)         | Filters in the URL, Spanish, the stock-capped merge notice, the demo order and its stored document; measured indexes                                                     |
| 12:00–17:00 | Krish    | Homepage, wholesale and quote wizard (5 m) | The wizard with a PDF and a language switch at step 3, the receipt, the MongoDB record, the Mailpit email, owner-only download (401, 404, 403)                           |
| 17:00–21:00 | Daniel   | Sampler, contact and email (4 min)         | Six pieces by keyboard, Spanish, the 201 receipt, the matching email in Mailpit; the failure demo on the local build                                                     |
| 21:00–24:00 | Varad    | Deployment, localization and process (3 m) | Railway services and variable names (never values), a deep-link refresh, `/api/nope` as JSON, Lighthouse and layout-shift numbers, the weekly records and PR history     |
| 24:00–25:00 | All      | Buffer and handover to questions           |                                                                                                                                                                          |

Hand-offs: each speaker ends by naming the next one. If a slot runs long, the buffer absorbs it; if the whole demo runs past 27 minutes, Varad shortens his closing segment to the deep-link refresh and the PR history.

## Varad's segments

**Overview (3 minutes).**

1. The problem: a bilingual storefront for a fictional chocolate maker, with retail shopping and a business quote flow.
2. Architecture: one Express API serves the built React client; `/api` routes and their JSON 404 come before the page fallback. MongoDB holds users, carts, orders, quotes and enquiries. Quote PDFs go to a private volume, never a public folder. Mail goes to Mailpit, a test inbox.
3. How the team worked: feature ownership in `docs/ownership.json`, one reviewed PR per member per phase, and decision D22 (Phases 3 and 4 together, one member at a time). CI runs the unit and database tests, the mock checks, the live-API browser journeys and a production image build on every PR.
4. Say once: checkout is simulated and takes no payment.

**Deployment, localization and process (3 minutes).**

1. Railway: the app, MongoDB and Mailpit in one project; variable names only. `TRUST_PROXY=2` was measured, not guessed: show the two-row table in `docs/deployment.md`.
2. Refresh `/es/catalog` (deep link survives), open `/api/nope` (JSON 404), switch EN/ES on any page (the URL keeps its place, the dictionary comes from `/api/i18n`).
3. Performance: pages load on demand; Lighthouse accessibility 100; the footer layout-shift fix (CLS 0.4–0.7 down to 0–0.1).
4. Process: the weekly records (`docs/weekly/`), the PR list with reviewers, and the rollback procedure.

## Before the presentation

The day before, on the deployed site (Varad, with each member):

- [ ] Health reports the database connected; the catalog shows 14 products.
- [ ] Create the demo accounts the segments need, with fictional `@example.test` emails: Aman's retail account (and one he registers live), Reethika's account with 2 Spring Chocolate Eggs already saved, Krish's business account, and a second business account for Krish's 404 (another business's quote). Keep the passwords in a password manager, not on slides.
- [ ] Prepare Krish's synthetic one-page PDF and a non-PDF file for the refusal.
- [ ] Sign in to the Mailpit inbox in a separate tab, so the password never appears on screen.
- [ ] Daniel's failure demo runs on a local build (`npm run services`, `npm run seed:catalog`, `npm start`), never by stopping the deployed Mailpit.
- [ ] Krish's "what can go wrong" part (mail server down, lost response) also runs on the local build, or Krish trims it from his segment (his note on #33).
- [ ] Rate limits: login allows 10 failures per 15 minutes and registration 10 per hour, per network. Rehearse on another network or more than an hour before.
- [ ] Close other tabs, turn off notifications, set the browser zoom so text is readable at the back of the room.

Fallback if the network or the host fails: the same flow on the local build against the seeded local database, with the deployed results in `docs/deployment.md` and the members' evidence files as backup.

## Rehearsal

Not held yet. Record the date, who attended, the total time and what changed here once it happens.
