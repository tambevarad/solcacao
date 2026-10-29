# SolCacao

A bilingual (English/Spanish) storefront for a fictional artisan chocolate maker, built by a five-person team for CSE 5335. Retail shoppers browse and filter the catalog, manage a cart and place a simulated order. Business buyers request custom-branded chocolate through a four-step quote wizard with a PDF upload. Visitors can also send enquiries and build a six-piece sampler. All products, companies and accounts in the app are fictional.

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
- **Real API:** start Docker, then `npm run services` (MongoDB and the Mailpit SMTP sink at http://localhost:8025). `npm run setup -- --member N` writes `.env` with a random `JWT_SECRET`. Load the fictional catalog with `npm run seed:catalog`, then `npm run dev` starts the web app and the API. The API refuses to start without a reachable MongoDB and a real secret.

No real emails or payments are ever sent.

## Checks

Run `npm ci`, `npm run check` (typecheck, unit and integration tests, structure checks) and `npm run build`. Browser tests need `npx playwright install chromium`, then `npm run test:e2e`. The persistence suites run against a real MongoDB when `TEST_MONGODB_URI` is set, for example `TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test_local npm test` after `npm run services`. CI runs everything, with a MongoDB service, on every pull request.

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

Phase 2 (front-end development) is complete and released to `main`. All five members' Phase 2 pull requests (#3, #5, #9, #10, #11), the integration PR (#12) and the follow-ups were reviewed and merged. The submitted version is tagged `phase-2-submission`. The full record is in `docs/weekly/week-4.md`, with screenshots and submission documents in `docs/phase2/`. Phase 3 binds the UI to the real API.
