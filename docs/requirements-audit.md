# Requirements audit and corrections

Audited against the supplied SolCacao DOCX blueprint and phase screenshot. No separate SolCacao PDF was present in the available files. All claims below refer to those supplied sources, not an unseen document. This is a specification/template audit, not a claim that future student features are implemented.

| Source requirement                                                        | Previous mismatch or risk                    | Corrected repository treatment                                                                                                      |
| ------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Phase1 Weeks1–2 setup/Tailwind/schema/routing/translations                | Phase1 omitted                               | 20 playbooks now cover all five students across four phases; Phase1 kit included                                                    |
| Phase2 components AND individual REST routes                              | Backend delayed to Phase3                    | Every Phase2 playbook has frontend and backend tracks                                                                               |
| Phase3 real API bind, trigger audit, security and ES/EN                   | Binding delayed to Phase4                    | Phase3 explicitly includes all four activities; no trigger invented                                                                 |
| Phase4 compression/query optimization/lazy images/cloud/docs/presentation | Some tasks generic                           | Each owner has launch/optimization/evidence steps; shared runbook retained                                                          |
| Two protected primary branches                                            | Local hooks could be mistaken for protection | Explicit actual remote settings and pending verification; no protection claim                                                       |
| Dedicated name-prefixed branches from development                         | Per-phase branch names                       | Roster defines dedicated branches, reused across phases; setup checks/synchronizes safely                                           |
| PR visual review, unit tests, at least1 peer approval                     | Only generic instructions                    | PR template/weekly logs/PDF specify each required action; cannot self-approve                                                       |
| Five exact frontend+backend ownership areas                               | Need central schema responsibility explicit  | Original split preserved; Student1 central ERD/schema; Student2 shell/static assets/i18n;3 catalog/cart;4 homepage/B2B;5 forms/SMTP |
| POST cart/persist JSON array                                              | Wrapper object in wire contract              | Raw CartLine[] body, revision moved to If-Match; internal DTO unchanged                                                             |
| GET products JSON List                                                    | Pagination envelope only                     | Raw Product[] list with pagination headers, adapter reconstructs internal ProductPage                                               |
| Suggested cacaoPct query                                                  | Only cacaoMin/cacaoMax                       | Exact cacaoPct alias plus mutually exclusive range; validated consistently                                                          |
| Phase1 academic overview/prototype/Teams demo                             | Explicitly excluded                          | Three-page overview draft, ERD, schema plan,16 original wireframe frames, hotspot map and required external assembly checklist      |
| Fran's design inspiration                                                 | Narrative only                               | Versioned observations, tokens, page specs, original placeholder art and fictional fixture factory                                  |
| One phase instruction for any agent                                       | Brief only and missing Phase1                | One command generates full reference packet, verifies phase/member/branch/predecessor, then agent implements only requested scope   |

## Explicit defaults still requiring team review

Simulated checkout/no money; USD; minimum wholesale quantity50; PDF vector-logo/tech-pack uploads up to5MiB; six-piece sampler inquiry; immediate b2b access for registered business accounts. These fill unspecified details, not claims about exact professor requirements. PDF follows the concrete blueprint example; other vector/tech-pack formats require a reviewed extension if instructor expects them. No admin/payment/AI feature added silently.

## Uncompleted external gates

No remote GitHub protection or peer approval has been performed. Corrected changes remain on the audit feature branch. No MarvelApp/MockFlow project was created. No real team names/handles, production photos, SMTP credentials or cloud host were supplied. Browser-test availability is documented separately. These facts must remain visible to agents and reviewers.
