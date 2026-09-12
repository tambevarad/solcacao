# Integration sequence and acceptance

## Phase 2 merge order

1. Student 2 publishes shared shell/primitives/localization wiring early. Existing page stubs remain until owned replacements merge.
2. Student 1 implements auth provider/forms and the already wired guard exports. No extra route edit is needed for account/wizard protection.
3. Student 3 publishes catalog fixture service, cart provider and retail pages. Header/homepage/sampler use documented public seams.
4. Students 4 and 5 complete homepage/wizard/support/sampler using the already merged interfaces.
5. Coordinator checks every route in mock mode and EN/ES, mobile and keyboard paths. No backend claim required at this stage.

Work can overlap on feature branches using the fixed stubs. These are merge dependencies, not instructions for one teammate to implement another's feature. Fetch/merge development into feature branches before final review. During conflict resolution, preserve both owners' valid work and run affected checks; do not blindly select ours/theirs.

## Phase 3 merge order

1. Student 1 shared db/auth/errors infrastructure and real auth routes.
2. Student 2 localization endpoint/public assets and Student 3 catalog/cart/orders.
3. Student 5 inquiry/notification bridge (sampler depends on Student 3 catalog port).
4. Student 4 quote/file handling (depends on Student 1 auth and Student 5 notification port).
5. All HTTP adapters tested against running backend; compiled app starts with actual Mongo. UI-wide switch is Phase 4.

## Phase 4 acceptance scenarios

| Scenario                                                      | Participants | Required evidence                                             |
| ------------------------------------------------------------- | ------------ | ------------------------------------------------------------- |
| Browse/filter -> product -> guest cart -> reload              | 2,3          | URL state and restored guest quantities                       |
| Guest cart -> login -> saved merge -> retry -> logout         | 1,2,3        | One additive merge, unchanged retry, no private cart leakage  |
| Business login -> wizard -> language switch -> PDF -> receipt | 1,2,4,5      | Database request, correct private file, truthful notification |
| Retail token POST quote; second business GET another's file   | 1,4          | 403 for wrong role,404 for nonowner                           |
| Sampler six pieces -> inquiry -> mail                         | 2,3,5        | Same catalog IDs, one DB record and local mail                |
| SMTP outage after quote/contact save                          | 4,5          | Saved request remains, failed notification reported           |
| Guest checkout -> altered client price -> retry               | 1,3          | DB-derived total, one simulated order, no stock deduction     |
| API offline in HTTP mode                                      | All          | Recoverable error; no mock success                            |
| Deployment refresh/restart                                    | 1,2,4        | Deep links work, DB/file data survive, no public uploads      |

Use synthetic accounts/data and an isolated test database. Do not use actual customer email addresses or logos in committed test evidence. Tests should inspect saved state and authorization outcomes, not only UI success text.

## Phase approval

Each owner sets ready_for_review with evidence; a peer reviews the diff, runs relevant tests and checks visual evidence. Coordinator marks integrated only after PR merge and full phase smoke checks. One phase has five separate ownership handoffs and one shared acceptance review. No automated status file is proof of human approval.
