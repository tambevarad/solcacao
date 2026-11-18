# Final presentation (Phase 4)

The course schedule gives each group 4 minutes per student with 3-minute transitions between groups. SolCacao is Group 2: five students, so **20 minutes, 7:23–7:43 PM**. Every member speaks for their own 4 minutes.

The deck (`SolCacao-final-presentation.pptx`, 14 slides) is kept outside the repository because it embeds six screen recordings (about 220 MB). It is part of the course upload; a PDF of the slides without the videos is in `docs/phase4/submission/`. The script below is the same text as each slide's speaker notes. In PowerPoint, use Slide Show → Presenter View: the speaker reads the notes while the recording plays. Each recording starts by itself when its slide opens. Slides advance on a click.

Site: https://solcacao-production.up.railway.app (real API, MongoDB, private uploads, Mailpit). Every product, company and account is fictional. Retail checkout is simulated by design: no payment is taken (said once, on slide 2).

## Running order

| Time        | Speaker  | Slides                                                                   | Recording                                                                 |
| ----------- | -------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| 0:00–2:40   | Varad    | 1 title, 2 the site in EN/ES, 3 architecture, 4 team, roles and process  | 1: the live site in English and Spanish (64 s)                            |
| 2:40–6:40   | Aman     | 5 sign-up, sign-in and access control, 6 the shared security checks      | 2: guest cart kept after sign-up, reload, retail refused, 403/401 (119 s) |
| 6:40–10:40  | Reethika | 7 catalog, cart merge and checkout, 8 measured indexes, orders and carts | 3: filters in the URL, "3 instead of 5", simulated receipt (96 s)         |
| 10:40–14:40 | Krish    | 9 the four-step quote, 10 private files and safe failures                | 4: business sign-in, PDF upload, Spanish at step 3, receipt, email (93 s) |
| 14:40–18:40 | Daniel   | 11 the six-piece sampler, 12 saved versus sent                           | 5: keyboard selection, receipt, the matching email (72 s)                 |
| 18:40–20:00 | Varad    | 13 GitHub record and live checks, Lighthouse numbers, 14 thank you       | 6: merged PRs, CI, deep-link refresh, JSON 404, health (45 s)             |

Each speaker's script is about 3 to 3½ minutes of speech, which leaves room for the pauses in the recordings and the hand-off ("…, over to you").

## The recordings

Made with a scripted browser (Playwright and Chrome) with a visible pointer and address bar; the shot list is kept with the deck (`RECORDINGS.md`).

- Recordings 1 and 6 use the live site and the public GitHub repository.
- Recordings 2–5 need a signed-in account or the test inbox, so they were recorded on a local copy of the same production build (`npm start` with `CLIENT_DIST_DIR`, MongoDB and Mailpit from `compose.yaml`) with fictional `@example.test` accounts. The address bar shows `localhost`, and slide 2's script says so.
- No password, token, inbox password, Railway variable value or real person's details appear on screen.

To replace a recording with one of the live site, record it as `RECORDINGS.md` describes, save it under the same number and rebuild the deck.

## Before the presentation

- [ ] Open the deck on the presenting laptop, start the slide show from slide 2 and check that the recording starts by itself (the deck is checked by schema, not yet in PowerPoint itself).
- [ ] Each speaker reads their notes once against a timer: 4 minutes each, 20 in total.
- [ ] Health on the live site reports the database connected, in case of a question that needs the live site.
- [ ] Turn off notifications; mirror the display so Presenter View shows the notes on the laptop only.

Fallback if the projector cannot play video: the PDF of the slides and the live site in a browser.

## Rehearsal

Not held yet. Record the date, who attended, the total time and what changed here once it happens.
