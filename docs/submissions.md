# Course submission checkpoints

Latest source: uploaded CSE5335 Fall2026 phase screenshot. Phase 2,3,4 are each 15% in that screenshot. The blueprint's functionality/code/UX/collaboration/deployment percentages describe a different rubric breakdown; do not conflate them.

## Phase 2 frontend development

Deliver complete React UI, responsive design and client-side functionality. Demo required. All five owners' pages must work together using mock adapters. Show both languages, mobile navigation, retail filters/cart/checkout simulation, business wizard, contact and sampler. Clearly state that persistence/auth/notifications are mocked at this stage.

Checklist: five reviewed PRs; no remaining required-page placeholders; no console errors; unit/interaction checks; desktop/mobile screenshots; all member phase-2 evidence; reproducible npm ci/dev:client instructions; exact integrated commit. Coordinator creates annotated tag `phase-2-submission` only after approval. Do not precreate a tag for unfinished work.

## Phase 3 backend development

Deliver REST Node/Express API, database integration and server business logic. Demo required. Show actual persisted users/products/cart/quotes/inquiries/orders, validation failures, protected routes/file access and SMTP test-sink evidence. Mock UI may remain available separately; direct API demo must be real.

Checklist: five reviewed PRs; clean Mongo setup and seed instructions; API map current; secrets excluded; upload ownership/cleanup checked; unit and isolated integration results; all member phase-3 evidence; exact commit; approved `phase-3-submission` tag.

## Phase 4 integration and final presentation

Deliver fully integrated application, comprehensive documentation and a 20–30 minute team presentation. Demo required face-to-face. Use the real API, real Mongo, private durable file storage and configured notification bridge. No mock fallback; explicitly identify simulated retail checkout as a scope default.

Suggested 25-minute allocation: overview/architecture 3min; Student1 auth/security 4min; Student3 retail/cart/checkout 5min; Student4 B2B 5min; Student5 sampler/contact/mail 4min; Student2 deployment/localization/team process 3min; buffer1min. Rebalance so all five speak and total remains20–30min.

Checklist: all integration.md scenarios; live URL; fresh-clone README test; current schema/API docs; actual contributors and PRs; license/asset register; secrets scan; evidence of desktop/mobile/EN/ES; known limitations; presentation rehearsal; approved `phase-4-final` tag.

Phase1 ERD/schema/overview/prototype deliverables are outside this request. The engineering schema document here does not satisfy or replace their separate academic submission.
