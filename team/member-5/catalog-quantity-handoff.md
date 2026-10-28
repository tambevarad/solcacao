# Regular-shop quantity selection — review proposal

Member 5, Phase 2 follow-up requested by Daniel Yglesias. Branch:
`daniel-catalog-quantity`, based on `development` at `e088f4b` after PR #12.
This is an additional requested catalog improvement, outside the original Member 5 assignment.
Member 3 must review and integrate this separate PR; no ownership exception is claimed.

Regular shop cards gain minus/plus buttons and direct quantity entry before Add to cart,
similar to the sampler controls. The amount respects stock, the 99-unit limit and quantities
already in the cart. Success resets it to one; failure preserves it. Existing rapid quick-add
requests still queue. Existing English/Spanish catalog keys are reused; no dictionary changes.

The two Member 3 files are `client/src/features/catalog/components/ProductCard.tsx` and
`client/src/features/catalog/pages/CatalogPage.tsx`. The private ProductCard callback changes
from `onAdd(product: Product): void` to `onAdd(product: Product, quantity: number): Promise<void>`
and adds optional `maxQuantity?: number`. CatalogPage is the sole production consumer and
forwards the amount through the existing `cart.add(product.id, quantity)` API. No public
provider, DTO, HTTP endpoint/schema, storage format or dependency changes.

Tests live under `tests/member-5`: `retail-quantity.test.tsx` and `visual.spec.ts`.
Existing Member 3 tests are unchanged. The sampler reset is isolated on `daniel-support`;
neither PR depends on the other. Phase 3 has not started.

| Verification on development `e088f4b`              | Result                                                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `taskset -c 0-3 npm run check`                     | PASS: 483 passed, 46 explicitly skipped database tests; typecheck, structure and workflow passed. |
| `npm run build`                                    | PASS; existing bundle-size advisory remains.                                                      |
| Owned Playwright suite                             | PASS: 7 tests, EN/ES and 375/768/1440 px.                                                         |
| Shared browser journeys on a fresh isolated server | PASS: 14 tests.                                                                                   |
| `git diff --check HEAD`                            | PASS.                                                                                             |

The Member 5 ownership checker exits 1 for exactly the two catalog source files listed
above; it is not a passing ownership check or an approved exception. Member 3 review
and integration remain required. Database tests need the real-Mongo CI job; no local
Mongo persistence pass or completed student demo is claimed.
