# Student 3 Phase 1 — Architecture & Setup

Blueprint execution window: Weeks 1–2. Academic checkpoint mapping: docs/roadmap.md. Read docs/context.md, docs/contracts.md, docs/api.json and your member context first. Preserve owner boundaries.

## Entry conditions

Audit supplied bootstrap; no earlier implementation phase exists. Team names/host access and external prototype are setup dependencies, not assumptions of completion.

## Ordered implementation steps

1. Finalize Product, Inventory and Cart fields, types, indexes and relationships with Student1. Explicitly model localized text, integer-cent price, stock and per-user cart items. Simulated Order is an extra scoped entity for required guest checkout.

2. Implement your Mongoose schema definitions under server/src/features/catalog/models; endpoints/business services belong to Phase2. Supply schema-only tests and ERD relationship input to Student1.

3. Create catalog/detail/cart/checkout wireframes and a filter/state transition specification. Fix URL query fields, raw product-list response and raw cart-array request before agents implement consumers.

4. Define one deterministic fictional fixture dataset through the shared factory and retain stable 24-hex IDs. Include multiple origins/cacao percentages/prices and an out-of-stock case. Never substitute Fran’s business data as SolCacao facts.

5. Outline catalog.* EN/ES keys and reducer actions ADD/REMOVE/UPDATE/CLEAR plus login-merge behavior. Supply retail workflow paragraph and prototype hotspot destinations.

6. Run schema/fixture checks, typecheck and build; share catalog/API contracts with homepage and sampler owners.

## Acceptance scenarios

- [ ] Owned schema/design contribution reviewed.
- [ ] Shell/schema/translation outline matches shared contract.
- [ ] Phase1 academic artifacts and external prototype status recorded honestly.

## Required verification

Run npm run check and npm run build, plus owned behavior/schema tests and visual review. Phase2 includes real backend validation tests as well as mock frontend interactions. Phase3 requires real Mongo/API tests; mocks do not count. Phase4 requires actual launch evidence. Run npm run check:ownership -- --member 3 --base development. Shared docs/config outside ownership go as exact handoff proposals to the owner.

## Handoff and stop

Update phase-1-evidence.md, handoff.md and status.json using real results. Set ready_for_review only when owned checks pass; only a reviewer records integrated after the actual PR merge. A blocked check remains blocked. Every PR needs visual review, passing unit tests and at least one peer approval. Stop before commit/push/merge/deploy unless the teammate explicitly asks. Never implement the next phase automatically.

## Demo

Explain your schema, interfaces, wireframes and Phase1 deliverables; join the MS Teams demo.
