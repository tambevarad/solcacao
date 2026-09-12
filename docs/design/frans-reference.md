# Fran's reference and SolCacao application

Reference inspection: September12,2026, from the live homepage, Bars/Pure Bars catalog,74% Madagascar Pure Bars page and custom-orders page. These are observed reference patterns, not requirements or SolCacao business facts.

| Observed Fran's pattern                                              | SolCacao proposal                                                                   | Owner |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----- |
| Spacious white header, centered brown brand mark, thin utility icons | Warm ivory header, original SolCacao wordmark, Lucide search/account/cart and EN/ES | 2     |
| Wide seasonal chocolate/packaging photographs with short headlines   | Original hero imagery slot, seasonal category link, accessible slide controls       | 4     |
| Large product images and concise names/prices                        | Responsive catalog with additional required origin/cacao/price controls             | 3     |
| Gallery beside quantity, packaging swatch and purchase action        | Image gallery plus origin/percentage/price/quantity/cart action                     | 3     |
| Expandable details, contents, care and ingredient sections           | Accessible product accordions; team-supplied food information only                  | 3     |
| Gift packaging shown through boxes, ribbons and tags                 | Visual packaging choices and uploaded corporate design in four-step wizard          | 4     |
| Business and gifting routes alongside retail navigation              | Distinct wholesale entry using shared identity and shell                            | 2,4   |
| Clear customer-care/static information                               | Contact, feedback, story/care layouts and sampler entry                             | 5     |

Verified URLs from that inspection:

- https://frans.com/
- https://frans.com/bars/pure-bars
- https://frans.com/bars/pure-bars/74-madagascar-pure-bars
- https://frans.com/custom-orders

Fran's inspected type was sans serif (Brandon Grotesque/Gotham in computed styles), not an ornate serif. We do not package proprietary fonts. Use the system font in tokens.json until the team chooses a properly licensed alternative. Photos, logo and copy have not been downloaded or licensed for reuse.

## Ready-to-use implementation inputs

`tokens.json` fixes proposed SolCacao colors/spacing/type/ratios. `page-specs.json` specifies page composition, responsive controls and owner. `../../client/public/placeholders/` contains original neutral SVG fixture art, not production photography. `../../contracts/fixtures.ts` supplies typed fictional products. `../phase1/prototype/frames/` and hotspots.json are original UI planning materials. None are screenshots or copies of Fran's artwork.

Photography brief: one wide seasonal composition; isolated front/inside/product-detail images per product; packaging examples for sleeve/gift box/bulk; one cacao-process image. Keep lighting/backgrounds consistent, text out of photo pixels, and alt text in both languages. Asset needs are specified here so an agent can build layout before approved imagery arrives.

No need to re-scrape Fran's for every phase. Use these observations to inform structure; keep SolCacao’s required features and identity distinct. Real product prices/certifications/contact details must come from the team, not this reference.
