# Requirement traceability

Owners coordinate shared rows; every member remains responsible for its own code quality, localization, tests, PRs and presentation. Scope defaults are labeled in decisions.md. Source section numbers refer to the supplied SolCacao blueprint; latest phase order comes from the screenshot.

| ID       | Owner | Requirement                            | Phase2                            | Phase3                              | Phase4                        |
| -------- | ----- | -------------------------------------- | --------------------------------- | ----------------------------------- | ----------------------------- |
| AUTH-01  | 1     | Retail and business registration/login | Forms/mock account flows          | Users/partners,bcrypt,JWT           | Real UI login and role checks |
| AUTH-02  | 1     | Profile management                     | Profile form                      | Own-user PATCH                      | Persisted updates             |
| AUTH-03  | 1     | Addresses                              | Address UI                        | Own-address upsert/list             | Ownership isolation           |
| AUTH-04  | 1     | Auth modals and route guards           | Reusable dialogs/guards           | Middleware ports                    | Shell/wizard wiring           |
| AUTH-05  | 1     | Account type separation                | Business fields/cues              | Role enforcement                    | Retail/b2b negative paths     |
| SEC-01   | 1     | Request/auth security                  | Client validation                 | Server validation/errors/rate limit | Security review               |
| SEC-02   | 1     | Central database foundation            | No DB                             | Connection/indexes/test DB          | Startup/secret readiness      |
| SEC-03   | 1     | No credential leakage                  | Memory-only fake session          | Hashed password/memory token        | Expiry/logout verification    |
| SHELL-01 | 2     | Sticky header/footer/routing           | Responsive shell                  | Public asset routing                | Deep-link deployment          |
| SHELL-02 | 2     | Mobile slide-out nav                   | Accessible drawer                 | No extra endpoint                   | Keyboard/mobile audit         |
| SHELL-03 | 2     | Global search and cart count           | Public hooks wiring               | Reuse catalog                       | Live state consistency        |
| SHELL-04 | 2     | EN/ES toggle and dictionaries          | Combined feature JSON             | GET dictionary                      | No missing keys/state loss    |
| SHELL-05 | 2     | Shared components                      | Primitives/tokens                 | No extra endpoint                   | Consistent page UX            |
| UX-01    | 2     | Premium responsive visual design       | Design system adoption by all     | Asset configuration                 | Contrast/performance audit    |
| CAT-01   | 3     | Catalog grid and product details       | Mock products/pages               | Product+Inventory models            | Live products                 |
| CAT-02   | 3     | Origin/cacao/price filters and sliders | URL controlled filters            | Validated DB query                  | Correct combined filters      |
| CAT-03   | 3     | Search/pagination/sorting              | Mock exact semantics              | GET products                        | Stable results/back nav       |
| CAT-04   | 3     | Localized product information          | EN/ES fixtures                    | Nested localized fields             | Live text selection           |
| CAT-05   | 3     | Inventory behavior                     | Stock-aware UI                    | Inventory DTO/service               | Unavailable/stock changes     |
| CART-01  | 3     | Slide-out shopping cart                | Reducer/provider/drawer           | No separate drawer API              | Navbar/drawer consistency     |
| CART-02  | 3     | Guest cart and checkout                | LocalStorage/cart/checkout UI     | Optional-auth orders                | Simulated guest receipt       |
| CART-03  | 3     | Saved cart and login merge             | Mock merge/revision               | Atomic persist/merge                | Retry/logout/race tests       |
| CART-04  | 3     | Quantity/remove/subtotal               | Client actions                    | Authoritative validation            | No stale overwrite            |
| ORDER-01 | 3     | Simulated checkout default             | No-payment UI                     | Order snapshot/idempotency          | Persisted accurate total      |
| HOME-01  | 4     | Homepage hero slides/seasonal showcase | Homepage via catalog API          | Reuse catalog                       | Live assets/products          |
| B2B-01   | 4     | Wholesale services page                | Molds/packaging/white-label slots | No separate endpoint                | Business entry                |
| B2B-02   | 4     | Four-step wizard                       | State machine/forms               | Quote schema                        | Real multipart journey        |
| B2B-03   | 4     | Brand/technical PDF upload             | File input/preview info           | Private storage/validation          | Durability/cleanup            |
| B2B-04   | 4     | Persist quote request                  | Mock receipt                      | POST B2B quote                      | Idempotent saved request      |
| B2B-05   | 4     | Partner authorization/private file     | Auth public guards                | Role+ownership download             | Nonowner rejected             |
| SUP-01   | 5     | Contact and feedback                   | Validated forms                   | Inquiry persistence                 | Real submission               |
| SUP-02   | 5     | Sampler builder                        | Six-piece selection               | Product revalidation                | Saved inquiry/mail            |
| SUP-03   | 5     | Information/static pages               | Story/care templates              | Public content assets               | Approved content review       |
| SUP-04   | 5     | WhatsApp redirects                     | Configured link                   | No message-sending API              | Correct encoded link          |
| SUP-05   | 5     | SMTP notification bridge               | Mock receipt                      | Nodemailer+notifyQuote              | Truthful saved/mail status    |
| OPS-01   | 2     | Git branches/PR review                 | All members use workflow          | Continuous integration              | History/review evidence       |
| OPS-02   | 2     | Testing/quality                        | Unit/interaction tests            | Real API/DB tests                   | Cross-feature/browser tests   |
| OPS-03   | 2     | Live deployment                        | Not required yet                  | Compiled backend readiness          | Live host verified            |
| OPS-04   | 2     | README/API/schema/presentation         | Phase evidence                    | API/schema updates                  | Full docs and20–30min demo    |

Blueprint source mapping: architecture §2; D2C/B2B §3; five roles §4; API baseline §5; branches/reviews §6; launch/docs §7; evaluation §8. Phase1 academic deliverables deliberately excluded.
