# Course submission checkpoints

Academic checkpoint source: uploaded CSE5335 Fall2026 phase screenshot. Phases 1,2,3,4 are each 15% in that screenshot. The blueprint's functionality/code/UX/collaboration/deployment percentages describe a different rubric breakdown; do not conflate them.

## Phase 1 planning and design

Deliver reviewed ERD, database schema design, exactly three-page overview, an interactive MarvelApp or MockFlow prototype and an MS Teams demo. All five contribute their subsystem design and evidence. Finalize docs/phase1 artifacts, verify the actual accessible prototype URL and record the integrated commit; create phase-1-submission only after acceptance. Local frames alone do not complete the prototype requirement.

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

Phase1 is now included: finalize the ERD/schema, three-page overview, interactive MarvelApp/MockFlow prototype and MS Teams demo. See docs/phase1/README.md. Local frames alone are not the hosted prototype requirement.

Implementation timing follows docs/roadmap.md: backend coding is already Phase2 and real API binding is Phase3. These submission headings describe what to demonstrate, not permission to delay blueprint milestones.
