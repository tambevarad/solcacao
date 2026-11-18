# SolCacao

A bilingual (English/Spanish) storefront for a fictional artisan chocolate maker, built by a five-person team for CSE 5335. Retail shoppers browse and filter the catalog, manage a cart and place a simulated order. Business buyers request custom-branded chocolate through a four-step quote wizard with a PDF upload. Visitors can also send enquiries and build a six-piece sampler. All products, companies and accounts in the app are fictional.

**Live site: https://solcacao-production.up.railway.app**, the full application on Railway: the Express API serving the React build, with MongoDB, private storage for quote PDFs and a Mailpit test inbox (`docs/deployment.md`). Register a fictional account there to sign in; the mock-mode demo accounts below do not exist on it. Checkout is simulated by design and takes no payment.

The Phase 2 front end is still hosted separately in mock mode at https://tambevarad.github.io, where sign-in, the cart, orders and forms are simulated in the browser. Fictional demo accounts for mock mode: `retail@solcacao.test` / `retail-demo-pass` and `business@solcacao.test` / `business-demo-pass`.

## Team and areas

| Member              | Area                                                        |
| ------------------- | ----------------------------------------------------------- |
| Aman Gulati         | Authentication, accounts and the server foundation          |
| Varad Tambe         | App shell, navigation, localization; integration and CI     |
| Reethika Gajulapati | Catalog, product pages, cart and simulated checkout         |
| Krish Ruparel       | Homepage, wholesale page and the business quote wizard      |
| Daniel Yglesias     | Contact, feedback, sampler, story and care pages; enquiries |

File ownership is in `docs/ownership.json`. Each member works on a dedicated branch recorded in `team/roster.json`.

## Stack

React 19, React Router, Vite and Tailwind CSS on the client; Node.js 24, Express 5, Mongoose and zod on the server, with MongoDB. Shared DTOs and validators live in `contracts/`. Tests use Vitest, Testing Library and Playwright.

## Run it

Prerequisites: Node 24.19.0 (`.nvmrc`) and Git. Docker is needed only for the real API.

- **Demo (mock mode, no database):** run `npm ci`, then `npm run dev:client`, and open http://localhost:5173. Sign-in, persistence and notifications are mocked in the browser, and a full page reload signs you out. Fictional demo accounts: `retail@solcacao.test` / `retail-demo-pass` and `business@solcacao.test` / `business-demo-pass`.
- **Real API:** start Docker, then `npm run services` (MongoDB and the Mailpit SMTP sink at http://localhost:8025). `npm run setup -- --member N` writes `.env` with a random `JWT_SECRET`. Set `VITE_API_MODE=http` in `.env`, load the fictional catalog with `npm run seed:catalog`, then `npm run dev` starts the web app and the API. The API refuses to start without a reachable MongoDB and a real secret.
- **Production build:** `npm run build` with `VITE_API_MODE=http`, then `npm start` with `CLIENT_DIST_DIR=dist/client`: the API serves the site and refreshes deep links. The `Dockerfile` builds the same thing, and `docs/deployment.md` is the Railway runbook.

No real emails or payments are ever sent.

## Checks

Run `npm ci`, `npm run check` (typecheck, unit and integration tests, structure checks) and `npm run build`. Browser tests need `npx playwright install chromium`, then `npm run test:e2e` (mock mode). The persistence suites run against a real MongoDB when `TEST_MONGODB_URI` is set, for example `TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test_local npm test` after `npm run services`. The live-API journeys (`npm run test:e2e:live`) need the compiled API serving the built client against MongoDB and Mailpit; CI's `e2e-live` job shows the setup. CI runs all of these, plus a production image build, on every pull request.

## Repository layout

- `client/`: React app, organised by feature (`client/src/features/<area>`) with shared UI in `client/src/shared`.
- `server/`: Express API, organised by the same features.
- `contracts/`: DTOs, validators and fixtures shared by both.
- `tests/`: per-member suites, contract and tooling tests, and Playwright journeys in `tests/e2e`.
- `docs/`: requirements, roadmap, API and data model, design references, decisions, integration plan, submission checkpoints and weekly records.
- `team/`: each member's phase plans, evidence, handoff notes and status.

## How we work

`main` and `development` are protected. Every change goes through a pull request into `development` that needs a passing CI run and one approval from another member, who also reviews it visually. Approved work is released to `main` through a reviewed release PR. The contributor workflow is in `docs/team-quickstart.md`, the merge order and dependencies in `docs/integration.md`, and the weekly integration records in `docs/weekly/`.

## Status

Phases 3 (backend and real-API binding) and 4 (integration and deployment) ran together, one member at a time (decision D22 in `docs/decisions.md`). Each member's work is one reviewed pull request: #27 and #28 (Varad), #29 (Krish), #30 (Reethika), #31 (Daniel), #32 (Aman), and the closing #33 (Varad) with its follow-ups #34 and #35. Phase 3 was released in #36 and submitted (tag `phase-3-submission`). Phase 4 then added the large-font header fix (#38) and the teammates' open proposals, the presentation and the Phase 4 documents (#39). The records are in `docs/weekly/week-5.md` to `week-7.md`, each member's evidence in `team/member-N/phase-3-evidence.md` and `phase-4-evidence.md`, and the 20-minute presentation plan in `docs/presentation.md`.

Phase 2 (front-end development) is complete and released to `main`. All five members' Phase 2 pull requests (#3, #5, #9, #10, #11), the integration PR (#12) and the follow-ups were reviewed and merged. The submitted version is tagged `phase-2-submission`. The full record is in `docs/weekly/week-4.md`, with screenshots in `docs/phase2/screenshots/`.

### Phase 3 and 4 submission

| Item                  | Where                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Code                  | Tags `phase-3-submission` and `phase-4-final` on `main` (created after the release PR merges)                       |
| Live site             | https://solcacao-production.up.railway.app                                                                          |
| Deployment and checks | [`docs/deployment.md`](docs/deployment.md): runbook, variables (names only), verified results, Lighthouse, rollback |
| API and data model    | [`docs/api.json`](docs/api.json) (contractVersion 2) and [`docs/data-model.md`](docs/data-model.md)                 |
| Presentation          | [`docs/presentation.md`](docs/presentation.md): 20 minutes, 4 per member, script and recordings                     |
| Phase 4 documents     | [`docs/phase4/submission/`](docs/phase4/submission): overview, AI usage log, slides (PDF, without the videos)       |
| Integration records   | [`docs/weekly/week-5.md`](docs/weekly/week-5.md) to [`week-7.md`](docs/weekly/week-7.md)                            |
| Member evidence       | `team/member-N/phase-3-evidence.md` and `phase-4-evidence.md`                                                       |
| Image licenses        | [`docs/assets.md`](docs/assets.md) (CC0 photos, each linked to its Openverse record)                                |

### Phase 2 submission

| Item                     | Where                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Code                     | Tag [`phase-2-submission`](https://github.com/tambevarad/solcacao/tree/phase-2-submission) on `main`         |
| Live demo                | https://tambevarad.github.io                                                                                 |
| Accessibility report     | [`docs/phase2/submission/accessibility-report.pdf`](docs/phase2/submission/accessibility-report.pdf)         |
| Meeting minutes          | [`docs/phase2/submission/meeting-minutes.pdf`](docs/phase2/submission/meeting-minutes.pdf)                   |
| Individual contributions | [`docs/phase2/submission/individual-contributions.pdf`](docs/phase2/submission/individual-contributions.pdf) |
| AI usage report          | [`docs/phase2/submission/ai-usage-report.pdf`](docs/phase2/submission/ai-usage-report.pdf)                   |

The HTML sources of the four reports are in `docs/phase2/submission/source/`.
