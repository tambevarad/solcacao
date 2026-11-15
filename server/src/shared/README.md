# Shared server infrastructure

Owner: Student 1. Database connection, request validation, auth middleware, typed errors and
startup configuration. Student 5 owns the notification bridge in its own feature and exports it for
Student 4. Do not serve the private upload directory as static content.

## Files

- `env.ts`: `loadServerEnv` validates configuration once at startup (`server/src/index.ts`). Any
  problem stops the process with a list of variable names, never their values.
- `db.ts`: `connectDb` (5 s server selection, no endless retry), `isDatabaseReady`, and
  `ensureIndexes`, which builds every registered model's indexes before the server listens.
- `auth.ts`: `requireAuth`, `optionalAuth`, `requireRole`, `signAccessToken`.
- `errors.ts`: the `{ error: { code, message, fieldErrors? } }` envelope. It maps body-parser
  failures to 400/413/415 and MongoDB outages to 503. Unexpected errors give a generic 500 and are
  logged by name only (MongoDB errors by name and code, because their messages can quote stored
  values). Request bodies, headers and tokens are never logged.
- `validation.ts`: `parseBody` for strict zod schemas.

## Environment (names only; values live in `.env` locally and in host variables in production)

| Variable                                             | Required                       | Rule                                                                                                                                    |
| ---------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`                                        | yes                            | `mongodb://` or `mongodb+srv://`                                                                                                        |
| `JWT_SECRET`                                         | yes                            | at least 32 characters, random, not a placeholder                                                                                       |
| `PORT`                                               | no (4000)                      | 1–65535; the host sets it                                                                                                               |
| `CLIENT_ORIGIN`                                      | yes when `NODE_ENV=production` | CORS allowlist: one origin or a comma-separated list, each exactly `scheme://host[:port]`. Include the deployed site's origin           |
| `TRUST_PROXY`                                        | no (0)                         | number of reverse-proxy hops in front of the API (2 on Railway, measured in `docs/deployment.md`), so per-IP rate limits see the client |
| `CLIENT_DIST_DIR`                                    | production only                | built client to serve (Student 2's router; must not overlap `UPLOAD_DIR`)                                                               |
| `UPLOAD_DIR`, `SMTP_*`, `MAIL_FROM`, `SUPPORT_EMAIL` | per feature                    | Students 4 and 5                                                                                                                        |

## Real MongoDB setup

1. Start the services: `npm run services` (Docker: `mongo:8.0` on `127.0.0.1:27017` and Mailpit on
   1025/8025). Without Docker, any local MongoDB 7 or 8 works.
2. In `.env`, set `MONGODB_URI=mongodb://127.0.0.1:27017/solcacao` and a random `JWT_SECRET`
   (`npm run setup` writes one).
3. Optional demo catalog: `npm run seed:catalog` (upserts fictional products and deletes nothing;
   it refuses `NODE_ENV=production`).
4. `npm run dev` (API on :4000, Vite proxies `/api`), or `npm run build && npm start`.
5. Tests: `TEST_MONGODB_URI=mongodb://127.0.0.1:27017/solcacao_test_ci npm run check`. Member 1's
   suites accept only a local or CI host, and they use and drop their own
   `solcacao_test_member1_<pid>` database.

Failure states, all deliberate:

- MongoDB unreachable at startup: exits with code 1 and "Could not connect to MongoDB (…)".
- Missing or weak secret, a bad origin, or a bad `TRUST_PROXY`: exits with code 1 and "Invalid
  server configuration" plus the variable names.
- Connection lost while running: `/api/health` returns 503 and routes that need the database
  return `503 SERVICE_UNAVAILABLE`. Nothing is queued or faked.
- `ensureIndexes` failure (for example existing duplicate emails): startup exits instead of
  serving without the unique index.
