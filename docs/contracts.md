# Contract v2

Read `contracts/index.ts`, `contracts/validation.ts` and `docs/api.json` together. DTOs are JSON boundaries, not Mongoose documents. Field spellings, enums, units and path names are fixed. Expand runtime validators to cover every endpoint in Phase 2; the starter schemas cover only representative critical boundaries.

## Wire conventions

Responses are normally `{ "data": <DTO> }`. Exception: GET /api/products returns a raw JSON Product[] list as required by the blueprint; pagination is in X-Page, X-Limit, X-Total-Count, X-Total-Pages headers. Cross-origin deployments expose those headers through CORS. catalog/http.ts calls requestRaw<Product[]> and reconstructs the internal ProductPage DTO; other consumers still see ProductPage. Failures are `{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid request", "fieldErrors": { "quantity": "Minimum 50" } } }`. `HttpClient.request<T>` unwraps data once and throws ApiError. UI and mock methods return DTOs directly. File downloads are binary and exempt from the JSON wrapper.

All IDs are 24-character hexadecimal ObjectId strings; no `_id` or `__v` in API output. Timestamps ISO 8601 UTC strings. All monetary amounts are integer USD cents; format with Intl.NumberFormat(locale, {style:'currency',currency:'USD'}). Never multiply a client-provided price. Request JSON must be strict; reject unexpected fields, malformed IDs, NaN, fractions where integers are required, oversized strings and invalid enum values. No raw query object passed into Mongo filters.

Statuses: 400 invalid input, 401 missing/invalid/expired token, 403 wrong role, 404 missing/not-owned resource, 409 duplicate email/cart conflict/idempotency-body conflict, 413 oversized upload, 415 unsupported file, 429 throttled, 500 unexpected internal failure, 503 unavailable database. No stack traces or database internals in responses. Codes: VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, EMAIL_EXISTS, CART_CONFLICT, IDEMPOTENCY_CONFLICT, OUT_OF_STOCK, FILE_TOO_LARGE, UNSUPPORTED_FILE, RATE_LIMITED, INTERNAL_ERROR, SERVICE_UNAVAILABLE. OUT_OF_STOCK uses 409.

## Authentication and provider contract

`useAuth()` exposes exactly the interface in auth/public.tsx. Successful login/register sets sessionToken, then sets user. `ready` is false only during authentication restoration/check; the template stores tokens in memory and starts logged out after a full reload. JWT claims: sub=user id, role=retail|b2b, exp, iss=solcacao, aud=solcacao-web; backend verifies signature/algorithm HS256, expiry/issuer/audience then loads user for current role. Never accept role from a form after login. Password length 12–72 UTF-8 bytes; bcrypt cost 12. Normalize email trim/lowercase before uniqueness check. Business companyName required. Retail and business can both shop; only business can submit/view quotes.

`logout()` clears token and user. No redirect side effect in API adapters. Auth UI accepts internal `returnTo` only (same-origin relative path beginning /en/ or /es/, no // or external URL). AuthProvider does not import catalog; CartProvider observes auth changes and owns merging. All HTTP 401 handling must produce a recoverable login state; no endless retry.

## Catalog

Query keys are search, origin, cacaoPct, cacaoMin, cacaoMax, priceMinCents, priceMaxCents, category, page, limit, sort, locale. page=1, limit=12 (1–48), sort=name, locale=en by default. cacaoPct is an optional exact percentage (0–100) as in the blueprint example; reject combining it with cacaoMin/cacaoMax. Cacao range 0–100 inclusive; price >=0; min<=max. origin exact canonical match. category bar|truffle|seasonal. search is a trimmed literal substring, maximum 100 chars, case-insensitive on the selected localized name/description; escape regex metacharacters. AND all supplied filters. Sorting name by selected localized name, priceAsc/Desc by cents, always id as tie breaker. Empty result total=0,totalPages=0,items=[]; an out-of-range page is empty without redirect. Only active products; missing/inactive slug ->404. Product DTO stock derives from Inventory.availableUnits. Query totals and returned items must apply identical predicates.

## Cart persistence, login and races

CartLine contains ONLY productId and quantity (1–99). Maximum 50 distinct products. No duplicate IDs in a persisted input; reject rather than silently double count. UI joins Product DTOs to show name/image/price; missing or inactive items show an actionable unavailable state. Subtotal is display-only; orders recalculate it server-side.

Guest state key `solcacao.guestCart.v1` stores `{items,mergeId}`. Generate mergeId once per guest-cart version using crypto.randomUUID, rotate when the guest edits it, and keep it for retries. Validate parsed localStorage; corrupt content resets safely. No PII/token there.

On guest -> authenticated transition: capture the guest cart, call merge(items,mergeId), replace UI state with returned cart, then clear guest storage ONLY after success. The server atomically sums matching product quantities, capped by min(99, available stock); drops unavailable/zero-stock products. UI compares before/after and displays adjustments. Other saved lines remain. A repeated mergeId for that user must not add again, even if the first response was lost. Store merge markers and cart revision atomically in the same Cart document. Limit stored markers to the latest 100 and document this retry horizon.

Authenticated changes use the internal persist({items,expectedRevision}) API. Its HTTP adapter sends ONLY the raw items array as JSON body to POST /api/cart/persist, matching Table5.1, and sends expectedRevision as a quoted integer in If-Match (for example "0"). Missing/malformed revision header ->400; no body wrapper. The adapter returns the data Cart DTO. Backend atomically updates only if revision matches; increment revision once. New cart revision 0. On conflict return CART_CONFLICT; UI refetches and asks the shopper to retry (no silent overwrite). Serialize local mutations to prevent older responses replacing newer state. Capture user id/session generation for each async action; ignore responses after logout/account switch. On authenticated -> guest clear in-memory authenticated cart and start an empty guest cart; do not copy private saved cart into guest storage. Server cart remains available after the next login. A full reload also begins logged out; saved server cart returns after login.

Known limitation (no contract change): `CatalogApi` has no lookup by id, so the cart resolves products for lines it has not loaded by paging `list({ limit: 48 })`. That is fine for the fixture catalog; if it grows, propose a reviewed `ids` query key or `getMany(ids)` here first.

## Simulated checkout

Student 3 owns checkout UI, server Order model and receipt. Request: items, valid email, address, UUID requestId. Required address recipient,line1,city,region,postalCode,country (ISO alpha-2); line2 optional; id is ignored/rejected as a checkout identity field. Validate per-field bounds and allow international postal strings. Authenticated requests derive userId from JWT, never body; guest uses null. Reject invalid supplied bearer tokens rather than silently downgrading to guest.

At submission re-read active products and inventory, reject insufficient stock with 409, calculate totals from current DB prices, save item snapshots and status=simulated. No payment, tax/shipping charge or stock deduction. Display 'Demo order — no payment collected' in both languages. Unique requestId prevents duplicates; same body returns original receipt; different body ->409. For guest retries also verify matching normalized email and request hash before returning receipt; do not expose guest orders by arbitrary ID. Persist no payment data. Order confirmation is passed through route state; a reload without receipt shows a safe link back to catalog, not a fabricated order.

## B2B quote

Exactly four steps: cacao+quantity; required PDF branding upload; packaging+company/contact/optional notes; review+submit. Defaults/enums/minimums in DTOs and validation. Preserve values on back/next and language switch; failed submission preserves the file in memory. Do not attempt to restore File from localStorage. On page reload require file reselection. Request metadata is one JSON string in multipart field `metadata`; upload field `designFile`. Do not manually set multipart Content-Type (browser adds boundary).

Server authenticates/authorizes before file handling; validates declared MIME application/pdf, .pdf extension, maximum 5MiB and PDF signature bytes. Use a generated UUID filename outside public assets; sanitize the display filename. Do not execute/render uploaded PDFs as HTML or expose raw filesystem paths. Delete temporary/orphan files on invalid metadata, save failure or duplicate request retry. Access ownership is derived from JWT. Idempotency key is (userId, requestId); compare canonical metadata and file digest on retry. Save before notification; email failure must not erase a saved quote or cause duplicate submissions. Receipt notificationStatus is truthful. GET receipt/file permits the owning B2B user only. Use attachment disposition and nosniff for downloads.

## Contact, feedback and sampler

Use one /inquiries endpoint and category field. Validation in shared schema: name 1–100, email <=254, message 10–2000, locale en/es, UUID requestId. Feedback uses category=feedback. Sampler uses category=sampler and exactly six pieces across 1–6 unique active product IDs (duplicates rejected); server resolves product data. It creates an inquiry, not a checkout order. Other categories must not include samplerItems. Rate-limit public forms and JSON size. Escape submitted text in email HTML; never accept arbitrary recipient/subject/from values. WhatsApp is a configured wa.me link using encodeURIComponent; no automatic message send and no sensitive form data in the URL.

## Localization and route contract

Every feature owns locales/en.json and es.json with flat keys prefixed auth., shell., catalog., b2b., support. Student 2 combines them in mock and backend dictionaries; duplicate or missing counterpart keys fail tests. GET /i18n/:locale returns the flat dictionary in data. Product text stays in Product.name/description/etc, not UI dictionaries. setLocale updates URL prefix while preserving path/query and mounted form/cart state. Set html lang. Supported route prefixes en/es only; unknown prefix renders not-found. / redirects to /en. Canonical slug never translated. Existing routes in client/src/routes.tsx are the source of truth. No separate router per member.

Key conventions:

- **Shape:** `<feature>.<area>.<item>`, with camelCase segments, for example `catalog.filters.cacaoRange` or `b2b.wizard.step2Title`.
- **Format:** one flat JSON object per file; string values only; the same keys in en.json and es.json.
- **Variables:** written `{name}` and filled with `t(key, { name })`.
- **No string building:** do not concatenate translated fragments or put markup in values.
- **Shared keys:** generic shell keys (`shell.action.*`, `shell.state.*`) may be reused by any feature. Ask Student 2 for new shared keys instead of copying them into your namespace.
- **Development checks:** a missing key renders as `⟦key⟧` and logs a warning. `npm run check` and `tests/member-2` fail on duplicate, unprefixed or unmatched keys.

## Shell public surface (Phase 2, Student 2)

These are the only shell imports other features should use. Signatures are stable; changes follow the proposal procedure above.

- `features/shell/public.tsx`:
  - `useLocale(): { locale: Locale; setLocale(locale: Locale): void; t(key: string, values?: Record<string, string | number>): string }`
  - `LocaleProvider`, already mounted in main.tsx. Do not mount a second one.
  - `localizePath(locale, path)`, for example `localizePath(locale, '/products/' + slug)` gives `/es/products/<slug>`. Build internal links with it.
  - `SUPPORTED_LOCALES`, `isLocale(value)`.
  - `usePageMeta({ title, description? })` overrides the route's default document title and description with already-translated text (for example a product name). Title renders as `<title> · SolCacao`.
- `client/src/shared/index.ts`: `Button`, `buttonStyles`, `Field`, `TextArea`, `Select`, `Dialog`, `Drawer`, `LoadingState`, `EmptyState`, `ErrorState`, `Placeholder`, `Photo`, `photos` (approved site photography) and `productPhotos` (square product photos in the `Product.images` shape for catalog fixtures); sources are in docs/assets.md. Usage: client/src/shared/README.md.
- `api/notImplemented.ts`: `NotImplementedError`, thrown by template stubs so a consumer can show a labeled pending state.

Page and route rules:

- `client/src/routes.tsx` wraps every routed page in `PageFrame`. It applies the localized default title and description (`shell.meta.<routeId>.*`) and contains render errors so the header, navigation and footer keep working.
- Layout already renders the skip link, sticky header, `<main id="main">` and footer. Pages render content only: one `<h1>`, no `<main>`, header or footer of their own.
- Owners keep their page file paths and default exports so routes.tsx keeps resolving. New routes or route paths go through Student 2.
- How the shell uses other features' existing ports. These describe the shell's side only and add no new obligations; owners keep their own implementation choices:
  - The header reads `useCart().count` and `open`, and calls `setOpen(true)`, all from the existing `CartState` interface. docs/design.md already asks for one shared right-hand cart drawer. The shared `<Drawer side="right">` is available for it, and Student 3 decides whether to use it.
  - Header and drawer account links read `useAuth().user`. Sign out (desktop header and mobile drawer) calls `logout()`. Both are existing `AuthState` members (Student 1).
  - Global search links to `/:locale/catalog?search=<trimmed term>` and Collections link to `/:locale/catalog?category=bar|truffle|seasonal`. These are the existing ProductQuery keys; design.md already keeps catalog filters in the URL.

## Cross-feature imports

Client permitted ports: auth/public.tsx useAuth/AuthProvider; catalog/public.tsx useCart/CartProvider/CartDrawer; shell/public.tsx useLocale/LocaleProvider/localizePath/usePageMeta (see "Shell public surface"); api/index.ts api/sessionToken; shared presentational primitives from client/src/shared/index.ts. Homepage gets products through api.catalog.list. Sampler gets products through api.catalog.list/get. Do not import another feature's internal state/reducer/pages.

Server ports to implement in Phase 2:

- Student 1 `server/src/shared/auth.ts`: requireAuth RequestHandler, requireRole(role:Role) RequestHandler, optionalAuth RequestHandler. Add `req.user?: User` via Express type augmentation; protected handlers assert presence. Middleware returns error envelope, never falls through on failure.
- Student 1 `server/src/shared/db.ts`: connectDb(uri:string):Promise<void>, disconnectDb():Promise<void>. Tests inject/use an isolated TEST_MONGODB_URI.
- Student 3 `server/src/features/catalog/service.ts`: getActiveProductsByIds(ids:string[]):Promise<Product[]> (deduplicated DTOs, missing excluded). Student 5 uses this for sampler validation; no direct model import.
- Student 5 `server/src/features/support/notifications.ts`: notifyQuote(input:{quoteId:string;companyName:string;contactEmail:string;locale:Locale}):Promise<'sent'|'failed'>. Never throw for an SMTP outage; Student 4 persists result. Attach no uploaded corporate file; authorized staff retrieval is outside the public app scope.

Student 2 assembles localization from feature JSON at build/runtime with a documented path that works in compiled deployment; don't rely on a missing source directory. Contract types remain environment-neutral; browser-only File is used only by the client B2bApi port, not server request types.

## Mock identity boundary for the Phase2 frontend track

Auth mock returns a token exactly `mock:<userId>` where userId is a valid deterministic ObjectId string. Its mock registry owns the fake accounts and verifies only synthetic in-memory passwords. AuthProvider stores that token in the existing sessionToken store. Catalog mock reads `sessionToken` from `client/src/api/session.ts` to key its in-memory saved cart by userId, rejecting missing tokens for protected mock operations. B2B mock calls the auth mock through a testable identity dependency or `api.auth.me()` at invocation time and enforces b2b. Avoid module-initialization API calls and cyclic imports. Mock register/me/profile/addresses refer to the same registry; no separate user copy in each feature. Mock tokens are never accepted by server middleware.

Do not share actual login secrets or reuse real user passwords in mock mode. Tests use `.test` email domains and fixed synthetic credentials. Mocks must implement the same errors and DTOs as HTTP, not invent extra fields exposed to components.

Guard signatures are prewired: RequireAuth({children:ReactNode}) and RequireRole({role:Role,children:ReactNode}). RequireRole includes the authentication check. Both fail closed in the template until Student1 implements the Phase2 UX. Do not rename them or add a second guard in the wizard page.

## Version2 migration note

No completed feature adapters existed at migration. All mock/http factories now receive a HttpClient with requestRaw as well as request. The product list/raw cart payload changes restore the blueprint’s wire formats, while keeping frontend provider APIs stable. Tests must verify HTTP shapes as well as DTO types.
