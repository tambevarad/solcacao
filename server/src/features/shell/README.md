# Shell backend

Owner: Student 2. See `team/member-2/context.md`.

## GET /api/i18n/:locale

- **Locales:** `en` and `es`. Anything else, including `EN` or `en-US`, returns `400` with
  `{ "error": { "code": "VALIDATION_ERROR", "message": "Unsupported locale", "fieldErrors": { "locale": "Use en or es" } } }`.
- **Success:** `200` with `{ "data": { "<feature>.<key>": "text" } }`, a flat dictionary combining all five features.
- **Caching:** `Cache-Control: no-cache` plus Express's ETag, so clients revalidate after a deploy.
- **Single source:** the data comes from `client/src/features/shell/dictionaries.ts`, which the client
  mock adapter also uses, so mock and HTTP shapes cannot differ.
- **Compiled build:** the explicit JSON imports are emitted into `dist/server/client/src/features/*/locales/`
  by `npm run build` (`resolveJsonModule` in `tsconfig.server.json`). No source-path lookup at runtime.
- **Adding copy:** owners edit only their own `locales/en.json` and `locales/es.json`. No server change is needed.

## Public asset router template (`assets.ts`)

`createPublicAssetsRouter({ root, privateDirs, maxAge })`:

- serves only allow-listed image and font extensions;
- ignores dotfiles; no directory index or redirects;
- returns a JSON 404 for anything else, including traversal attempts;
- sets `nosniff`;
- throws at startup if `root` overlaps any private directory such as `UPLOAD_DIR`.

It is **not mounted yet**. `server/src/app.ts` belongs to Student 1. The proposed mount is in
`team/member-2/handoff.md`; production SPA serving is Phase 3. Student 4's private uploads are never
passed as a public root.
