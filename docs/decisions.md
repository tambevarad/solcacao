# Scope decisions and change log

These are explicit implementation defaults adopted to prevent five agents making different guesses. They are not all stated by the professor. Confirm material scope changes with the team/instructor before changing dependent code.

| ID  | Decision                                                                     | Basis and consequence                                                                                                                          |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| D01 | Preserve both source schedules                                               | Blueprint execution phases1–4 plus academic checkpoint crosswalk in roadmap.md                                                                 |
| D02 | React with TypeScript, Vite, Tailwind, Express, MongoDB/Mongoose             | Required stack plus compile-time contracts to reduce model mismatch; exact installed versions locked                                           |
| D03 | Retail checkout is simulated, no money collected                             | Blueprint says guest checkout but defines no gateway; persist a simulated receipt/order; do not reserve/deduct stock or claim fulfillment      |
| D04 | Quantity checked against available inventory at checkout                     | Validate feasibility; simultaneous simulated orders may overlap because no fulfillment is performed                                            |
| D05 | A registered B2B account immediately qualifies for quote submission          | No approval/admin workflow specified; public registration may only choose retail/b2b                                                           |
| D06 | Wholesale minimum 50, maximum 100000 units                                   | Project default; wizard and backend use same values                                                                                            |
| D07 | PDF branding file required, maximum 5 MiB                                    | PDF is the blueprint's concrete example. Other vectors/tech packs require a reviewed format expansion, not silent acceptance                   |
| D08 | Sampler = exactly six pieces submitted as an inquiry                         | Requirement underspecified; support owns it and reuses catalog products; no automatic sampler price or checkout SKU                            |
| D09 | JWT bearer access token held in memory; expiry one hour                      | Stateless auth. Refresh requires login; no refresh token/password reset scope. Never persist passwords or tokens in localStorage               |
| D10 | Guest cart only stored in localStorage                                       | Key `solcacao.guestCart.v1`; authenticated cart is server-owned; see logout/merge rules                                                        |
| D11 | Currency USD; origin stored as canonical English country name                | Stable filtering; visible labels may be translated separately                                                                                  |
| D12 | Private local file storage by default                                        | Requires a persistent deployment disk. S3 is an optional reviewed alternative, not two parallel implementations                                |
| D13 | SMTP transport injected, local Mailpit for tests                             | No real emails from development tests; actual recipient configured by environment                                                              |
| D14 | No admin, payments, shipping integration, AI chatbot or manufacturing engine | Not explicitly required; don't expand scope automatically                                                                                      |
| D15 | Feature dictionaries combined by shell                                       | Each member writes namespaced EN/ES JSON; one backend dictionary endpoint reads them                                                           |
| D16 | No frontend SSR migration                                                    | Required SPA; improve titles, descriptions, semantic HTML, image metadata and crawlability within this architecture; don't promise perfect SEO |

## Change proposal template

Decision/contract ID; problem; proposed exact new value/signature; owners affected; UI/mock/API/model/test changes; migration/backwards compatibility; reviewer decision; linked PR; date. Store a proposal in your own handoff. Student 2 updates this canonical log only after review.

D17: Wire compatibility restored: raw Product[] list with pagination headers; raw CartLine[] persist body with If-Match revision. D18: Dedicated name-prefixed branches are reused across phases; no mandatory per-phase branch naming. D19: Phase1 plans, ERD/overview drafts and prototype assets are included; a real MarvelApp/MockFlow URL remains a required external deliverable.

D20 (Phase 2 shell foundation, Student 2; reviewed through its PR): additive, backward-compatible client surface with no DTO/HTTP change, so contractVersion stays 2.

- `useLocale().t` gains an optional `values` argument for `{name}` interpolation. Existing one-argument calls are unchanged.
- `localizePath` and `usePageMeta` are exported from shell/public.tsx.
- Template stubs throw `NotImplementedError` (still an Error) so the shell can show labeled pending states.
- Every routed page is wrapped in `PageFrame` for default titles and error containment.
- Dictionaries come from one module shared by the mock adapter and GET /api/i18n/:locale.
- BrowserRouter opts into the React Router v7 `v7_startTransition` and `v7_relativeSplatPath` flags. This removes console warnings; the only splat route is not-found.

D21 (2026-10-25, coordinator Varad Tambe): Phase 2 implementation is authorized for all five members now, owners as recorded in team/roster.json.

- The shared Phase 1 setup was delivered through PRs #1 and #2. Each member's `team/member-N/status.json` Phase 1 entry stays as recorded until that member records their own Phase 1 contribution truthfully. Nothing is backfilled as integrated.
- `npm run agent -- --member N --phase 2` therefore shows the "previous phase" condition as a note citing this decision, not as a blocker. Agents proceed on the member's dedicated branch and mention it in phase-2-evidence.md. Branch mismatches still block.
- Academic Phase 1 items (hosted MarvelApp/MockFlow prototype, MS Teams demo) are tracked separately in docs/phase1/prototype/README.md and are not implied complete.

D22 (2026-11-12, coordinator Varad Tambe): Phases 3 and 4 run together, one member at a time.

- Turn order: Student 2 (Varad), Student 4 (Krish), Student 3 (Reethika), Student 5 (Daniel), Student 1 (Aman), then a closing Student 2 turn for the final records, the release to main and the tags. Each turn is one PR covering both phases. The next turn starts after it merges and begins by merging development into the member's branch.
- Krish reviews Student 2's PRs; Varad reviews the other members' PRs. Every PR still needs a visual review, passing checks and one approval.
- `npm run agent -- --member N --phase 4` therefore shows an unfinished Phase 3 as a note citing this decision, not as a blocker. Each phase keeps its own evidence file and status entry. Branch mismatches still block.
- Phase 3 evidence comes from a real MongoDB and Mailpit, and Phase 4 evidence from the deployed site; mocked runs count for neither. If Phase 3 is due before the sequence ends, the coordinator tags `phase-3-submission` on the latest merged commit that meets the Phase 3 checklist in docs/submissions.md.
