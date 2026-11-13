# Student 4 Phase 4 evidence

State: ready for review on `krish-b2b` (D22 turn 2, shared PR with Phase 3).

- **Steps 1 to 3 and 5:** verified locally on the compiled production build (the same image Railway
  runs), against MongoDB and Mailpit.
- **Step 4:** verified on the deployed site (https://solcacao-production.up.railway.app), including
  the upload surviving a Railway redeploy. See "Deployed site".
- **Step 6** (the team rehearsal) has not happened yet.

## Implemented requirements and changed paths

- **Step 1, the real-HTTP journey re-run.** It ran on the final code
  (`tests/member-4/quote-journey.live.spec.ts`, 5 passed; details in phase-3-evidence.md). One owned
  defect was fixed: the draft was lost when the session ended (phase-3-evidence.md, step 2).
- **Step 2, images.**
  - **Lazy loading that actually defers:**
    - `components/DeferredPhoto.tsx` (new): `useNearViewport` and `DeferredPhoto` mount a photo
      within 600 px of the viewport. Until then, a same-size box holds its place and carries the
      alt text unless the photo is decorative.
    - Used for the homepage's collection, business, story and sampler photos, the wholesale page's
      service and packaging photos, and the featured product images, which also decode
      asynchronously.
  - **Hero:** the hidden slides' photos mount 2 s after the page's `load` event while slides
    rotate, or when the visitor changes slide (`components/HeroCarousel.tsx`).
  - **Featured products:** the loading state keeps the grid's final layout
    (`components/FeaturedProducts.tsx`), so the sections below neither move nor count as near the
    top while it loads.
  - **Compression:** the files belong to Student 2 (`client/public/images`). They are already
    compressed WebP (about quality 80). The measured options are proposal 2 in handoff.md:
    - re-encoding at quality 75 saves only 10%;
    - a 768 px size for the three half-width photos halves them on 1× desktops.
  - Alt text and reduced motion are unchanged: no autoplay when reduced motion is preferred, and
    then the hidden slides never load unless opened.
- **Step 3:** phone, desktop, keyboard and focus, EN/ES, loading and error states, and console
  errors were checked on the live API (phase-3-evidence.md, "Manual demo observations").
- **Step 4:** verified on the deployed site ("Deployed site" below). The private upload directory is
  `UPLOAD_DIR=/data/uploads` on the `solcacao-volume` volume, outside the client root
  (docs/deployment.md). A quote's PDF still downloads, byte-identical, after a redeploy.
- **Step 5:**
  - feature notes and known limits in `client/src/features/b2b/README.md` (new) and
    `server/src/features/b2b/README.md` (private files in production, triggers, limits);
  - test evidence in both evidence files;
  - the presentation draft below.
- **Step 6:** the rehearsal is a team activity; it has not happened yet.

## Commands actually run

Measured with headless Chromium (`@playwright/test`):

- the images each page downloads before any scrolling, after the network is idle;
- the same after scrolling to the bottom.
- "Before" is the deployed `development` (13a60a2) on Railway; "after" is this branch's production
  build served by the compiled API locally.
- The image files are identical in both, so the byte counts compare directly. Load times do not
  (network), so they are not compared.

| Page, viewport                   | Before: images, KB before scrolling | After: images, KB before scrolling | After scrolling (both) |
| -------------------------------- | ----------------------------------- | ---------------------------------- | ---------------------- |
| `/en`, 1440×900 @1×              | 13, 563 KB                          | 8, 266 KB                          | 13, 563 KB             |
| `/en`, 1440×900 @2×              | 13, 704 KB                          | 8, 345 KB                          | 13, 704 KB             |
| `/en`, 375×812 @3×               | 13, 704 KB                          | 3, 130 KB                          | 13, 704 KB             |
| `/en/wholesale`, 1440×900 @1×/2× | 7, 219/442 KB                       | 7, 219/442 KB (whole page is near) | 7                      |
| `/en/wholesale`, 375×812 @3×     | 7, 442 KB                           | 3, 115 KB                          | 7, 442 KB              |

| Command                                                                 | Result | Relevant output                                                                                   |
| ----------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| `cwebp -q 75 -m 6 -sharp_yuv` trial on the 18 homepage files            | done   | 778 KB to 702 KB (−10%); not applied: Student 2's files, second lossy pass                        |
| `cwebp -q 75 -resize 768 0` trial on `home-story/sampler/business-1024` | done   | 241 KB to 119 KB; proposal 2                                                                      |
| `npm run check`, `npm run build`, ownership, e2e suites                 | pass   | see phase-3-evidence.md (564/564 against MongoDB; no chunk-size warning; 15 mock e2e; 4 + 5 live) |
| Screenshots, 3 widths × EN/ES × 7 views on the live API                 | pass   | no overflow, no console errors                                                                    |

## Deployed site

https://solcacao-production.up.railway.app, which runs `development` (13a60a2, before this PR). This
checks the host and the deployed code; this PR's changes reach the site after it merges.

On 2026-11-12 at 19:49 local time (2026-11-13T01:49:20Z), in the in-app browser at desktop width:

- **The journey, done by Krish by hand:**
  - a new business account with fictional details (`@example.test` address);
  - all four steps with the synthetic one-page PDF `live-check/solcacao-live-brand.pdf` (616 bytes,
    not committed).
- **Network:** `POST /api/auth/register` 201, then `POST /api/b2b/quote` 201 with
  `{"id":"6af66ca09f84837d31262923","status":"submitted","notificationStatus":"sent"}`.
- **Receipt on screen:** "Quote request received", the same reference, "Email notification: Sent".
  There were no console errors.
- **Without a token:** `GET /api/b2b/quotes/6af66ca09f84837d31262923` and `/file` both return 401.
  Guessed public paths (`/<id>.pdf`, `/uploads/b2b/…`, `/data/uploads/b2b/…`) return JSON 404s.
- **Health:** `/api/health` reports the database connected.

- **Owner download before the redeploy:** `.agent/live-check/check-live-quote.sh`, run by Krish in
  his terminal, signs in through the API with the password typed there, not shown. It got:
  - `GET /api/b2b/quotes/6af66ca09f84837d31262923` 200, the same receipt;
  - `/file` 200: `application/pdf`, `attachment`, `nosniff`, `private, no-store`, 73,036 bytes,
    SHA-256 `ec0de7a4daa21d4586132065f06a3151604d3f52a83cca288fdf93037df4cf64`;
  - without a token, 401.
  - The file is a PDF Krish chose by hand, not the synthetic test file, so the comparison is between
    downloads.
- **Demo Mailpit inbox** (Varad's password, typed by Krish into the same script): exactly one
  message for the reference: "SolCacao: wholesale quote", to `support@example.test`, 0 attachments,
  at 2026-11-13T01:49:20.175Z.
- **Redeploy** of the `solcacao` service by Varad, at Krish's request. Railway's GitHub deployment for
  `13a60a2` (environment `innovative-unity / production`) went `in_progress` at 01:53:56Z and
  `success` at 01:54:21Z, after the upload at 01:49:20Z. Health was connected again at 01:55:07Z.
- **Owner download after the redeploy** (same script, second run): 200 with the same 73,036 bytes
  and the same SHA-256 `ec0de7a4…cf64`; without a token, 401. **The upload survived the redeploy.**
- **Phone, keyboard, EN/ES and console, headless Chromium:**
  - `/en`, `/es`, `/{en,es}/wholesale` and `/{en,es}/wholesale/request` at 375, 768 and 1440 px all
    return 200 with the right `lang`, no horizontal overflow and no console errors;
  - the wizard route shows the sign-in prompt to a signed-out visitor.
- **Signed-in wizard on the live site, in Krish's tab, at 375 px in Spanish, keyboard only:**
  - Space chose a cacao profile, 300 was typed, and Enter moved to step 2;
  - focus went to the "Archivo de marca" heading, with no overflow and no console errors.
  - Stopped before choosing a file, so no second quote was created.

## Manual demo observations

Recorded in phase-3-evidence.md for the live API locally. The deployed-site observations will be
added under "Deployed site".

## Public contract compatibility and peer dependencies

- No contract change.
- Image files and `photos.ts` are Student 2's: proposal 2 in handoff.md.
- A UI download needs a contract change: proposal 3.

## Known limitations or blocked checks

- **The deployed site still runs `development`:** this PR's changes (the kept draft, deferred
  photos) reach it after the merge. They were verified locally on the same production build.
- **Hidden hero photos:** when the hero rotates, they still load about 2 s after the page loads.
  They are deferred, not removed, so they are ready before the first slide change.
- **Photo bytes after scrolling are unchanged:** reducing those needs proposal 2.

## Presentation segment draft (5 minutes, Student 4: B2B)

No personal data on screen: an `example.test` business account, the fictional catalog, and a
synthetic one-page PDF.

1. **0:00–0:30, homepage.**
   - Hero slides, with rotation that pauses and never autoplays with reduced motion.
   - Featured chocolates from the live catalog API.
   - Only the first photo loads with the page (one slide of the before/after table).
2. **0:30–1:00, wholesale page.**
   - The services and how a quote works.
   - "Start your custom quote" asks a guest or retail visitor to sign in with a business account.
3. **1:00–2:45, the four-step wizard, signed in as a business.**
   - Cacao and quantity; then the branding PDF (show a non-PDF being refused in the browser).
   - At step 3, switch to Spanish: the step, answers and file stay.
   - Review, then send: the receipt shows the reference, the time and "Email notification: Sent".
4. **2:45–3:45, what the server kept.**
   - The record in MongoDB: fields, `requestId`, file name and size, with no file contents and no
     public URL.
   - The email in the demo Mailpit inbox: reference, company and contact only, with no attachment.
   - Protected retrieval: the owner downloads the PDF; no token gives 401; another business gets
     404; a retail account gets 403.
5. **3:45–4:30, what can go wrong.**
   - A lost response: "Try sending again" returns the same reference, with one record and one
     email.
   - With the mail server down, the receipt says the email failed and the request is saved.
   - The session ending mid-draft: sign in again and the draft and file are back.
6. **4:30–5:00, limits and handover.**
   - Files live on the host's volume; staff retrieval is out of scope.
   - The proposals for the shared image sizes and a download button.

## Review

Proposed commit: `krish-b2b` (PR to `development`, shared with Phase 3)
Reviewer: tambevarad (D22)
PR:
Integrated commit:
