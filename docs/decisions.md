# Scope decisions and change log

These are explicit implementation defaults adopted to prevent five agents making different guesses. They are not all stated by the professor. Confirm material scope changes with the team/instructor before changing dependent code.

| ID  | Decision                                                                     | Basis and consequence                                                                                                                          |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| D01 | Use screenshot phases 2/3/4                                                  | Latest user instruction; overrides old week labels, not feature requirements                                                                   |
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
