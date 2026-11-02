# TaskOrbit — Production-Grade Implementation Plan

## 0. Audit summary (starting point)

| Area | Finding | Risk |
|---|---|---|
| Authentication | `X-Dev-User-Id` header trusted; unknown callers default to **project manager** | Critical |
| Sessions / cookies | None | Critical |
| Authorization | Only workflow transitions + two ownership checks; every role can list/read all data and all emails | High |
| Validation | express-validator on 4 POST routes only; PATCH routes accept raw values; no param (UUID) validation; no length limits | High |
| Injection / XSS | No screening of text input | High |
| Uploads | MIME accepted from client, `application/octet-stream` allowed, no content check | Medium |
| Frontend | Dev "switch user" widget, no login, no route guards, forms validate only "not empty"; `ReviewModal` uses an unimported `tasksApi` | High |
| Tests | 56 backend tests (1 failing, network-dependent), 0 frontend tests | Medium |
| Paper | Describes `requireRole()`, bearer tokens, Firebase, TypeScript, 29 tests — none match the code | Medium |

## 1. Application definition

* **Type:** multi-tenant, role-based, workflow-aware **web application** (SPA + REST API) for collaborative project management with deadline-conflict detection and versioned deliverable review.
* **Target audience:** software agencies / IT service teams and their clients — four personas: **Client**, **Project Manager**, **Assignee** (developer), **Reviewer** (QA / tech lead); secondarily students and educators studying web-technology security.

## 2. Security architecture

1. **Authentication** – e-mail + password; bcrypt (cost 12) hashes; password policy (≥ 10 chars, upper/lower/digit/symbol, no e-mail inside); account lock after 5 failures (15 min); generic error messages (no user enumeration); constant-time compare.
2. **Sessions** – server-side sessions table; 256-bit random id, only its SHA-256 stored; cookie `to_sid` is `HttpOnly`, `SameSite=Lax`, `Secure` (production), `Path=/`; idle timeout 30 min, absolute 8 h (30 d with *remember me*); rotation at login; revoke on logout / password change.
3. **CSRF** – double-submit token (`to_csrf` cookie + `X-CSRF-Token` header) enforced on every state-changing request; Origin check as second layer.
4. **Authorization** – `requireAuth`, `requireRole(...)`, resource-level scoping (`access.js`): client → own requests/projects; assignee → own tasks; reviewer → review pipeline; manager → everything. Field-level hiding: e-mails and internal activity only for managers.
5. **Public registration** creates *client* accounts only; staff accounts are created by managers.
6. **Transport / headers** – Helmet with CSP, HSTS (prod), `x-powered-by` off, strict credentialed CORS allow-list, global + auth rate limiters, 100 kB body cap, request ids, stack traces never sent in production.
7. **Encryption** – passwords: bcrypt; session ids: SHA-256 at rest; transport: TLS (HSTS) in production; file storage: private bucket + short-lived signed URLs; secrets only in env.
8. **Audit** – login success/failure, lockout, logout, password change, user creation → `activity_logs`.

## 3. Input verification & validation (before anything is saved)

Layered, applied to **every** textbox/endpoint:

1. **Sanitiser middleware** (`inputGuard`): walks `body`, `query`, `params`; rejects (HTTP 400) values containing SQL-injection signatures, script/HTML/event-handler/`javascript:` payloads, template/shell/path-traversal/NoSQL operator patterns, `__proto__`/`$`-keys, control chars, over-long strings; trims & normalises Unicode.
2. **Schema validation** per route (express-validator): UUID params, enums, ISO dates, length limits, types (strings only for text), unknown-field stripping.
3. **Business validation** in services (date order, workflow state, ownership, stale-version).
4. **Data layer** – Supabase SDK / PostgREST only (parameterised); DB CHECK / FK constraints.
5. **Frontend mirror** (`utils/validation.js`) – same rules applied in each form before submit with inline errors; React escapes on output.

## 4. Backend work-list

* New: `config/env.js`, `utils/{password,tokens,validators,sanitize}.js`, `middleware/{auth,csrf,inputGuard,rateLimit,security}.js`, `services/{authService,userService}.js`, `controllers/authController.js`, `routes/{authRoutes,userRoutes}.js`.
* Schema: `profiles` += `password_hash`, `failed_logins`, `locked_until`, `last_login_at`; new `sessions` table; seed with hashed demo passwords (dev only).
* Mock DB: add `sessions`, delete/`in`/`neq`/`gte` support so the full stack runs without cloud.
* Every controller: role guard + scoped queries + whitelisted fields; multipart upload hardened (magic-byte check, safe file name, extension allow-list).

## 5. Frontend work-list

* Login / Register pages, auth slice (bootstrap via `/api/auth/me`), `ProtectedRoute` with role guard, 403/404 pages, logout, session-expiry handling, CSRF header, `withCredentials`.
* Remove dev identity switcher. Manager "Add team member" form.
* Form validation on all inputs; fix `ReviewModal`; remove dead imports; lint clean for real errors.

## 6. Test strategy

| Level | Tooling | Scope |
|---|---|---|
| Unit | Jest | sanitiser, validators, password policy, tokens, conflict detector, state machine |
| Control (middleware) | Jest + supertest | auth, CSRF, role guard, rate limit, input guard |
| Module / integration | Jest + supertest | auth lifecycle, RBAC matrix per endpoint, data-hiding, workflow end-to-end, upload |
| Validation / attack | Jest | SQLi, XSS, NoSQL, traversal, oversize, type-confusion payloads against every writable endpoint |
| Page / component | Vitest + Testing Library | Login, Register, ProtectedRoute, forms block malicious input |
| Use cases | documented in `docs/testing-guide.md` | UC-01 … UC-20 mapped to automated test ids |
| Browser smoke | manual script in the in-app browser | login → role flows → logout |

## 7. Documentation

* README, `docs/ARCHITECTURE.md`-style overview inside README, updated `docs/testing-guide.md`, Postman collection, `.env.example`.
* **Research paper** updated to match the real implementation (architecture, auth/session/cookie design, validation pipeline, new test table, evaluation status, limitations).

## 8. Out of scope / honest limits

* Pattern-based screening is defence-in-depth, not a substitute for parameterised queries.
* Supabase RLS policies are provided in SQL but only exercised against the mock store in CI.
* No performance/concurrency benchmarks are claimed.
