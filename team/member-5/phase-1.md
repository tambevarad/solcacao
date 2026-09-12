# Student 5 Phase 1 — Architecture & Setup

Blueprint execution window: Weeks 1–2. Academic checkpoint mapping: docs/roadmap.md. Read context.md, docs/contracts.md, docs/api.json and your member context first. Preserve owner boundaries.

## Entry conditions

Audit supplied bootstrap; no earlier implementation phase exists. Team names/host access and external prototype are setup dependencies, not assumptions of completion.

## Ordered implementation steps

1. Finalize inquiry/feedback/sampler schema and validation plan with Student1; define contact fields, categories, six-piece sampler default and notification status.

2. Implement owned Mongoose schema definitions without sending mail. Plan Zod validation and the Nodemailer/SMTP port used by Student4; recipients come from server config.

3. Prepare contact/feedback/sampler/story/care wireframes and error/success states. Identify genuinely missing business content rather than inventing history/certifications.

4. Outline support.* EN/ES keys and generic encoded WhatsApp redirect behavior; no message is sent by an agent during setup.

5. Provide support/personalization overview paragraph, prototype screens/hotspots and email mockup fields for Phase1 assembly.

6. Run schema checks and review sampler selection/contact paths, including exactly-six rule as a documented default rather than a professor-stated number.

## Acceptance scenarios

- [ ] Owned schema/design contribution reviewed.
- [ ] Shell/schema/translation outline matches shared contract.
- [ ] Phase1 academic artifacts and external prototype status recorded honestly.

## Required verification

Run npm run check and npm run build, plus owned behavior/schema tests and visual review. Phase2 includes real backend validation tests as well as mock frontend interactions. Phase3 requires real Mongo/API tests; mocks do not count. Phase4 requires actual launch evidence. Run npm run check:ownership -- --member 5 --base development. Shared docs/config outside ownership go as exact handoff proposals to the owner.

## Handoff and stop

Update phase-1-evidence.md, handoff.md and status.json using real results. Set ready_for_review only when owned checks pass; only a reviewer records integrated after the actual PR merge. A blocked check remains blocked. Every PR needs visual review, passing unit tests and at least one peer approval. Stop before commit/push/merge/deploy unless the teammate explicitly asks. Never implement the next phase automatically.

## Demo

Explain your schema, interfaces, wireframes and Phase1 deliverables; join the MS Teams demo.
