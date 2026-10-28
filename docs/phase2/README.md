# Phase 2 submission evidence

Mock-mode screenshots of every member's pages at desktop (1440 × 900) and mobile (375 × 812), captured on 2026-10-28 from the integrated code (development fc8ee86 plus integration PR #12) with no console errors. Both `02-catalog` shots were retaken the same day at 1307a52 (release #20) to show the quantity picker added in #15; the other pages did not change. Sign-in, persistence and notifications are mocked in the browser at this stage.

| File (desktop- / mobile-) | Page                               | Owner    |
| ------------------------- | ---------------------------------- | -------- |
| 01-home                   | Homepage                           | Member 4 |
| 02-catalog                | Catalog with filters               | Member 3 |
| 03-product-es             | Product page in Spanish            | Member 3 |
| 04-checkout               | Checkout (empty cart state)        | Member 3 |
| 05-wholesale              | Wholesale page                     | Member 4 |
| 06-login                  | Sign in, with the demo accounts    | Member 1 |
| 07-register-es            | Create account in Spanish          | Member 1 |
| 08-contact                | Contact form                       | Member 5 |
| 09-sampler-es             | Six-piece sampler in Spanish       | Member 5 |
| 10-story                  | Our story                          | Member 5 |
| 11-cart-drawer            | Cart drawer after adding a product | Member 3 |
| mobile-12-menu            | Mobile navigation drawer           | Member 2 |

Header, footer, language switch and layout on every page: Member 2. Run it yourself with `npm ci` and `npm run dev:client` (see README "Run it"). Integration record: docs/weekly/week-4.md.

## Submission documents

PDFs in `submission/`, with their HTML sources in `submission/source/`:

| Document                     | Contents                                                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| accessibility-report.pdf     | WCAG 2.2 AA audit: axe-core across 117 page states (EN/ES at 1440, 375 and 320 px) plus manual checks; one reflow fix |
| meeting-minutes.pdf          | Weekly in-person meetings, September–October 2026, compiled afterwards and cross-referenced to PRs and decisions      |
| individual-contributions.pdf | Each member's area, PRs, line counts and reviews                                                                      |
| ai-usage-report.pdf          | How the team used Claude Code and Codex, what the team did itself, and the safeguards                                 |
