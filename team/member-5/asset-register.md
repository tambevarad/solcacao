# Member 5 asset and content register

Reviewed November 14, 2026. Canonical licenses and source links stay in `docs/assets.md` (Member 2).
No new third-party image, font, logo or external hotlink was added.

| Use        | Existing approved source                                                                   | Formats and bytes                                | Behavior                                                               |
| ---------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------- |
| Story hero | `photos.homeStory`, rawpixel CC0; Openverse `11378714-b78c-483f-bd53-3ba411d4cb7f`         | WebP 640: 68,692; 1024: 140,596                  | Shared Photo responsive source; hero eager, localized alt              |
| Care hero  | `photos.productDarkShards`, rawpixel CC0; Openverse `9a5dcf1b-6dd4-4853-a020-973c3d92d237` | WebP 640: 18,816; 1024: 40,678                   | Shared Photo responsive source; hero eager, localized alt              |
| Sampler    | `api.catalog` Product.images, Member 3's approved fictional-fixture pool                   | Existing square WebP; no duplicated owner assets | Lazy loading, asynchronous decoding, square layout, EN/ES catalog alt  |
| Controls   | Existing shared buttons and typography                                                     | No added icon font/library                       | Native keyboard behavior, 44 px sampler controls; no support animation |

Hero variants remain below the shared 80 KB small / 160 KB large budgets. They are already
compressed and owned by Member 2; recompressing copies inside support would duplicate assets.
Sampler imagery stays catalog-owned and is consumed through its API.

Story copy describes the supplied blueprint's catalog, business and enquiry journeys. Care copy
directs visitors to available product information and support. Neither invents business history,
certification, shelf life, storage temperatures, allergen assurances or fulfillment promises.
Both pages label stock photography as illustrative. Business-specific history and care
instructions require supplied, approved content.

`phase-4-performance.json` captures actual image requests and DOMContentLoaded observations on
the existing deployed build at 375/1440 px, reduced motion enabled. These are unthrottled headless
measurements with possible warm caches, not Lighthouse scores or guaranteed user latency.
