# Asset register

| Path                               | Creator/source                                        | Permission and use                                          | Status                                 |
| ---------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------- |
| client/public/placeholders/*.svg   | Original geometric artwork generated for this project | Included for project layout/fixture use; not Fran's imagery | Ready as placeholders                  |
| docs/phase1/prototype/frames/*.svg | Original wireframe layouts generated for this project | Planning/import/reference use                               | Draft prototype inputs                 |
| docs/phase1/erd.svg                | Original exact relationship drawing                   | Project planning/documentation                              | Draft; validate with all schema owners |
| docs/design/frans-reference.md     | Observations with verified public URLs                | Reference notes only; no copyrighted photos/fonts copied    | Ready                                  |

## Site photography

Real photographs for the homepage, the wholesale page and the quote wizard. They replace the labeled image slots. All are CC0 1.0 (public domain dedication) from rawpixel's public-domain collection, found through Openverse with the license filter set to CC0/public domain. CC0 needs no attribution, but the sources are recorded here so anyone can verify them.

- **Selection rules:** warm, natural light matching the ivory/cacao palette; no visible third-party brand names or logos; no people; no fabricated product claims. Alt text describes what each photo actually shows, in EN and ES.
- **Files and changes:** files live in `client/public/images/<name>-<width>.webp`, at 640 px plus the largest available width (up to 1024 px). Changes made: resized and re-encoded (WebP, quality 78); metadata removed.
- **Using them:** import `photos` and `<Photo>` from `client/src/shared/index.ts`. `tests/member-2/photos.test.ts` checks dimensions, size budgets (160 KB large / 80 KB small) and alt text.
- **Not suitable for:** product listings that imply a specific SolCacao product. Product photography stays team-supplied through catalog data (Student 3).

| Key                  | Used for                                              | Source                                                                                                                        | License | Changes         |
| -------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------- | --------------- |
| `heroSeasonal`       | Home hero slide 1                                     | [rawpixel](https://www.rawpixel.com/image/3303729/free-photo-image-biscuit-cake-ice-cream)                                    | CC0 1.0 | Resized to WebP |
| `heroTruffles`       | Home hero slide 2                                     | [rawpixel](https://www.rawpixel.com/image/5944929/free-public-domain-cc0-photo)                                               | CC0 1.0 | Resized to WebP |
| `heroBusiness`       | Home hero slide 3                                     | [rawpixel](https://www.rawpixel.com/image/5923512/photo-image-background-xmas-public-domain)                                  | CC0 1.0 | Resized to WebP |
| `collectionBars`     | Home collections: bars                                | [rawpixel](https://www.rawpixel.com/image/5920475/photo-image-public-domain-chocolate-free)                                   | CC0 1.0 | Resized to WebP |
| `collectionTruffles` | Home collections: truffles                            | [rawpixel](https://www.rawpixel.com/image/5905831/photo-image-background-public-domain-black)                                 | CC0 1.0 | Resized to WebP |
| `collectionSeasonal` | Home collections: seasonal                            | [rawpixel](https://www.rawpixel.com/image/5970175/chocolate-easter-eggs)                                                      | CC0 1.0 | Resized to WebP |
| `homeBusiness`       | Home corporate gifting                                | [rawpixel](https://www.rawpixel.com/image/3305305/free-photo-image-gift-box)                                                  | CC0 1.0 | Resized to WebP |
| `homeStory`          | Home story teaser                                     | [rawpixel](https://www.rawpixel.com/image/3338504/free-photo-image-bean-cc0-creative-commons)                                 | CC0 1.0 | Resized to WebP |
| `homeSampler`        | Home sampler teaser                                   | [rawpixel](https://www.rawpixel.com/image/5945408/free-public-domain-cc0-photo)                                               | CC0 1.0 | Resized to WebP |
| `wholesaleHero`      | Wholesale hero                                        | [rawpixel](https://www.rawpixel.com/image/5940184/free-public-domain-cc0-photo)                                               | CC0 1.0 | Resized to WebP |
| `serviceMolds`       | Wholesale: custom molds                               | [rawpixel](https://www.rawpixel.com/image/5911920/image-background-public-domain-wood)                                        | CC0 1.0 | Resized to WebP |
| `servicePackaging`   | Wholesale: personalized packaging                     | [rawpixel](https://www.rawpixel.com/image/6033021/photo-image-christmas-public-domain-ribbon)                                 | CC0 1.0 | Resized to WebP |
| `serviceWhiteLabel`  | Wholesale: white-label                                | [rawpixel](https://www.rawpixel.com/image/5904416/photo-image-background-public-domain-wood)                                  | CC0 1.0 | Resized to WebP |
| `packagingSleeve`    | Wholesale and wizard: sleeve                          | [rawpixel](https://www.rawpixel.com/image/5905466/photo-image-background-public-domain-food)                                  | CC0 1.0 | Resized to WebP |
| `packagingGiftBox`   | Wholesale and wizard: gift box                        | [rawpixel](https://www.rawpixel.com/image/5905170/photo-image-background-xmas-public-domain)                                  | CC0 1.0 | Resized to WebP |
| `packagingBulk`      | Wholesale and wizard: bulk                            | [rawpixel](https://www.rawpixel.com/image/6068517/free-public-domain-cc0-photo)                                               | CC0 1.0 | Resized to WebP |
| `storyCacaoPods`     | Available for the Story page (Student 5)              | [rawpixel](https://www.rawpixel.com/image/4031091/photo-image-tree-plant-nature) by U.S. Agency for International Development | CC0 1.0 | Resized to WebP |
| `productDarkShards`  | Available for catalog or care content (Students 3, 5) | [rawpixel](https://www.rawpixel.com/image/3305322/free-photo-image-chocolate-photography-cc0)                                 | CC0 1.0 | Resized to WebP |

Production logo, chocolate photography, sourcing/certifications, ingredient/allergen information, prices and contact details remain team-supplied content. Register source/permission and translated alt text when assets are added. Fictional fixtures must never appear as verified business claims.
