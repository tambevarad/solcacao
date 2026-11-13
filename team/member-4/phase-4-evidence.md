# Student 4 Phase 4 evidence

State: in progress on `krish-b2b` (D22 turn 2, shared PR with Phase 3).

- **Done and verified locally:** steps 1 to 3 and 5. The local runs are on the compiled production
  build, the same image Railway runs, against MongoDB and Mailpit.
- **Pending, step 4 on the deployed site** (https://solcacao-production.up.railway.app):
  - the journey on the live site and the upload surviving a redeploy;
  - these need a business sign-in by Krish, plus a Railway redeploy and the Mailpit inbox password
    from Varad. Results go in "Deployed site" below once they exist.

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
- **Step 4:** pending (above). The private upload directory is already set for this host:
  `UPLOAD_DIR=/data/uploads` on the `solcacao-volume` volume, outside the client root
  (docs/deployment.md).
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

Pending. This section is filled in from the real checks:

- the business journey on https://solcacao-production.up.railway.app: sign-in, four steps with a
  synthetic PDF, receipt, notification status;
- the email in the demo Mailpit inbox;
- after Varad redeploys the `solcacao` service, the same PDF still downloads for its owner, with the
  same SHA-256;
- phone width, keyboard, EN/ES and console on the live site.

## Manual demo observations

Recorded in phase-3-evidence.md for the live API locally. The deployed-site observations will be
added under "Deployed site".

## Public contract compatibility and peer dependencies

- No contract change.
- Image files and `photos.ts` are Student 2's: proposal 2 in handoff.md.
- A UI download needs a contract change: proposal 3.

## Known limitations or blocked checks

- **Blocked, deployed-site checks:** they need Krish's live sign-in and Varad's Railway redeploy and
  Mailpit password; no one else has Railway access.
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
