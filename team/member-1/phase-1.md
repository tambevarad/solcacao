# Student 1 Phase 1 — Architecture & Setup

Blueprint execution window: Weeks 1–2. Academic checkpoint mapping: docs/roadmap.md. Read context.md, docs/contracts.md, docs/api.json and your member context first. Preserve owner boundaries.

## Entry conditions

Audit supplied bootstrap; no earlier implementation phase exists. Team names/host access and external prototype are setup dependencies, not assumptions of completion.

## Ordered implementation steps

1. Review and finalize Users, Corporate Partners and Address schema specifications in docs/data-model.md. Coordinate relationships across all five owned subsystem models; do not implement another student’s models.

2. Implement your Mongoose schema definitions and serializers in server/src/features/auth/models without registration/login endpoints yet. Define normalized unique email, role enumeration, company linkage, address ownership and passwordHash field. Never seed a real user or password.

3. Finalize docs/phase1/erd.mmd and the cross-model data dictionary with the other owners. Confirm references, indexes, cardinalities and deletion/ownership behavior. Class ERD must match the implementation schemas.

4. Design JWT/bcrypt middleware interfaces and authentication form/profile wireframes; use the existing provider/guard stubs. Record error codes and role flows in your phase1 contribution.

5. Provide the identity/security paragraph for the three-page overview and authentication/profile prototype screens. Check the supplied overview draft against the finalized scope; no completed-auth claims.

6. Run schema validation tests without a live DB where possible, typecheck/build and visual review of your wireframes. Submit your phase1 PR with a peer review.

## Acceptance scenarios

- [ ] Owned schema/design contribution reviewed.
- [ ] Shell/schema/translation outline matches shared contract.
- [ ] Phase1 academic artifacts and external prototype status recorded honestly.

## Required verification

Run npm run check and npm run build, plus owned behavior/schema tests and visual review. Phase2 includes real backend validation tests as well as mock frontend interactions. Phase3 requires real Mongo/API tests; mocks do not count. Phase4 requires actual launch evidence. Run npm run check:ownership -- --member 1 --base development. Shared docs/config outside ownership go as exact handoff proposals to the owner.

## Handoff and stop

Update phase-1-evidence.md, handoff.md and status.json using real results. Set ready_for_review only when owned checks pass; only a reviewer records integrated after the actual PR merge. A blocked check remains blocked. Every PR needs visual review, passing unit tests and at least one peer approval. Stop before commit/push/merge/deploy unless the teammate explicitly asks. Never implement the next phase automatically.

## Demo

Explain your schema, interfaces, wireframes and Phase1 deliverables; join the MS Teams demo.
