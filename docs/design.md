# SolCacao design contract

## Reference and intent

Fran's Chocolates was inspected September 12, 2026: https://frans.com/ , https://frans.com/bars/pure-bars , https://frans.com/bars/pure-bars/74-madagascar-pure-bars , https://frans.com/custom-orders . Its spacious white layout, brown typography, large gift photography, rectangular imagery, packaging swatches and product accordions inform this direction. SolCacao uses its own identity and assets. No Fran's trademark/logo/photos/copy in implementation.

## Shared visual choices

Use existing Tailwind tokens: ivory #FAF7F1, cacao #38251E, copper #875334, line #DED6CD, plus error #9B2C1F for validation/failure text only (6.9:1 on ivory). Optional muted gold is decorative only until contrast is checked. Use a clean sans-serif system font initially; no per-feature font imports. Normal body 16px, line-height around 1.5; headings fluid and restrained. Main content max-width 1200px, horizontal padding 16px mobile/24px tablet/32px desktop. Spacing scale 4/8/12/16/24/32/48/64. Buttons rectangular with subtle 2–4px rounding, min height 44px. No gradients, glass cards or dashboard styling in the shop.

Student 2 owns shared Button, Field, Select, Dialog/Drawer, LoadingState, EmptyState and ErrorState exports under client/src/shared. Specify props using standard React HTML attributes. Members may implement local composition but request shared primitives rather than fork styles. Never wait to implement feature logic just because a cosmetic primitive is pending; use native elements and then adopt the shared primitive through its owner.

## Page contracts

- Header: sticky brand/nav with search, account, EN/ES and cart count; mobile menu is a drawer. Shopper nav: Shop, Collections (catalog category links), Wholesale, Our Story, Contact. Product routes remain canonical and localized by prefix.
- Homepage: seasonal hero slides, featured products, category links, corporate gifting feature, craftsmanship story teaser, sampler entry. Real photos/copy intentionally absent initially; clearly labeled image slots until content is supplied. Slider supports previous/next/pause, reduced motion and keyboard; do not hide essential navigation behind autoplay.
- Catalog: desktop filters beside responsive product grid; mobile filters in a drawer. Show names, price, origin and cacao percentage; URL holds filters/page/sort so refresh/back works. Loading does not wipe selected filters.
- Product: gallery next to primary details/quantity/add action; ingredients/allergens/care in accessible accordions. Image aspect ratios consistent; meaningful translated alt text.
- Cart: one shared right drawer, visible subtotal, editable quantities, remove and checkout. Escape closes, focus trapped and restored, background scroll locked. Visible status for merge/stock adjustments.
- B2B: show packaging examples then four-step form; horizontal stepper desktop and compact current-step text mobile. Completed steps remain editable; summary visible before submission.
- Forms: visible labels, inline errors and a focusable error summary; preserve valid entries after error. Submit button reflects pending state and prevents duplicate requests. Confirmation must be truthful (mock vs saved vs notification failure).
- Account: distinct retail/business cues; no separate website skin. Auth dialogs reuse the same form components as login/register routes.

## Verification

At 375px, 768px and 1440px: no horizontal overflow, controls usable, drawers work, long Spanish labels wrap without hiding actions. Keyboard-only complete login, filtering, cart and wizard. Focus visible, labels associated, error/status updates announced, contrast at least 4.5:1 for normal text. Respect prefers-reduced-motion. Keep cart/form state across language toggle.

All members add matching en/es feature keys; no hardcoded customer-facing prose except clearly marked template placeholders, which must be replaced in Phase 2. Do not translate IDs, DTO enums or API routes. Currency stays USD.

Record final asset source and permission in docs/assets.md. A content/asset manifest is separate from functionality. Missing supplied brand content must be listed in phase evidence; never represent fictional certifications/testimonials as real.
