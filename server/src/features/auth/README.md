# Auth backend

Owner: Student 1. See `team/member-1/context.md` and `team/member-1/handoff.md`. The client side is
`client/src/features/auth` (`useAuth`, `AuthProvider`, `RequireAuth`, `RequireRole`, the pages).

## Routes (docs/api.json)

| Route                          | Access | Success                                            | Failures                                         |
| ------------------------------ | ------ | -------------------------------------------------- | ------------------------------------------------ |
| `POST /api/auth/register`      | public | `201 { data: { user, token, expiresAt } }`         | 400 validation, 409 `EMAIL_EXISTS`, 429, 503     |
| `POST /api/auth/login`         | public | `200 { data: { user, token, expiresAt } }`         | 400, 401 "Invalid email or password", 429, 503   |
| `GET /api/auth/me`             | signed | `200 { data: User }`                               | 401, 503                                         |
| `PATCH /api/users/me`          | signed | `200 { data: User }` (name; company for b2b)       | 400 (role, email or unknown field), 401, 503     |
| `GET /api/users/me/addresses`  | signed | `200 { data: Address[] }` (own only, oldest first) | 401, 503                                         |
| `POST /api/users/me/addresses` | signed | `200 { data: Address }` (create, or update by id)  | 400 (max 20, bad field), 401, 404 (not own), 503 |

All responses are `Cache-Control: private, no-store`. Bodies are strict: unknown fields, a `role`
other than `retail`/`b2b`, or a `userId` are rejected. `User` never contains `passwordHash`,
`active`, timestamps or `_id`.

## Tokens and sessions

- HS256 JWT signed with `JWT_SECRET`: `sub` = user id, `role`, `iss=solcacao`, `aud=solcacao-web`,
  `exp` one hour after `iat` (D09). No refresh token.
- `requireAuth` checks the algorithm, signature, expiry, issuer and audience, then loads the
  current active user. The role always comes from the database, never from the token or a body.
- `optionalAuth` lets guests through, but a supplied invalid token is still 401. `requireRole`
  gives 403 for the other role.
- The client keeps the token in memory only, so a reload signs out. The session ends at
  `expiresAt` (also re-checked when the tab becomes visible). A 401 signs out only the session that
  made the request.

## Data (docs/data-model.md)

- `users`: unique `email` (trimmed and lowercased before every lookup), bcrypt cost 12, `role`
  `retail` or `b2b`, `active`.
- `corporatePartners`: unique `userId`, `companyName` (required for b2b). Registration deletes the
  user again if this insert fails (compensation; no replica-set transaction).
- `addresses`: `{ userId, _id }` index; every read and update is filtered by the signed-in user.
- No database triggers are specified. The equivalent rules are service code plus indexes: the
  unique email index decides concurrent registrations, and the user-filtered upsert enforces
  address ownership.

## Throttling and limits

- Login: 10 failed attempts per 15 minutes per client IP (successes are not counted).
- Registration: 10 per hour per client IP.
- Both return `429 RATE_LIMITED` with standard `RateLimit` headers. Behind a host proxy, set
  `TRUST_PROXY` to the number of proxy hops (2 on Railway, measured in `docs/deployment.md`). Otherwise every visitor shares the
  proxy's address and one bucket.
- JSON bodies are limited to 100 kB (`413`). Passwords are 12–72 UTF-8 bytes. Login rejects longer
  ones with the same 401, so bcrypt never silently truncates them.
