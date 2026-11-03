# TaskOrbit

**A workflow-aware collaborative project-management web application with deadline-conflict detection,
versioned deliverable review and role-based access control.**

| | |
|---|---|
| **Type of application** | Multi-role, server-authoritative **web application** — React single-page app + Express REST API + PostgreSQL (Supabase) with private file storage. |
| **Target audience** | Software agencies / IT service teams and their clients. Four personas: **Client** (orders work, accepts results), **Project Manager** (plans, assigns, resolves conflicts), **Assignee / Developer** (delivers work), **Reviewer** (QA / tech lead). Secondary: students and educators of web-technology security. |
| **Key guarantees** | Only legal task transitions (HTTP 409), only authorised roles (HTTP 403), reviews bind to the *latest* submission version, overlapping assignments are detected *before* saving. |

## Quick start

```bash
# 1. API  (http://localhost:3001) — runs on an embedded demo database if Supabase is not configured
cd node-backend
npm install
npm run dev

# 2. Web app (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Demo accounts (development / seed data **only** — never load `seed.sql` into production).
Password for all of them: `TaskOrbit@2026!`

| Role | E-mail |
|---|---|
| Project Manager | `bob@taskorbit.io` |
| Assignee | `carol@taskorbit.io`, `dave@taskorbit.io` |
| Reviewer | `eve@taskorbit.io` |
| Client | `alice@clientcorp.io` (new clients can self-register) |

## Security & web-technology features

| Area | Implementation |
|---|---|
| Authentication | E-mail + password, **bcrypt** (cost 12), password policy (≥10 chars, mixed case, digit, symbol, no name/e-mail), generic error messages, account lock-out after 5 failures (15 min), login/register rate limiting |
| **Sessions** | Server-side session table; 256-bit random id; only its **SHA-256** is stored; idle timeout 30 min, absolute 8 h, "remember me" 30 days; rotated at login, revoked on logout / password change |
| **Cookies** | `to_sid` — `HttpOnly`, `SameSite=Lax` (configurable), `Secure` in production, path `/`; session cookie unless *remember me* |
| **CSRF** | Per-session synchroniser token in `X-CSRF-Token` for every POST/PATCH/DELETE + strict `Origin` allow-list |
| Authorisation | `requireAuth` → `requireRole(...)` → resource-level scoping (`accessService`) → workflow guard (role + ownership + legal edge). Clients see only their own data, assignees only their tasks, reviewers only the review pipeline |
| Data hiding | No credentials ever serialised; e-mails visible only to self + managers; client activity feed redacted; storage paths never exposed; deliverables released to clients only after approval; signed, short-lived download URLs |
| Input verification | `inputGuard` screens **every** param / query / body value (SQL, XSS/HTML, command, template, path-traversal, NoSQL, prototype-pollution, null-byte, oversize) → HTTP 400 **before** validation or saving; per-route `express-validator` schemas strip unknown fields; same checks mirrored in every React form |
| Uploads | Extension allow-list, **magic-byte verification**, executable/script detection, EICAR test signature, safe file names, 25 MB cap, memory-only buffering |
| Transport & headers | Helmet (CSP `default-src 'none'`, HSTS in production, `nosniff`, no referrer), strict credentialed CORS allow-list, `no-store`, request ids, 100 kB body cap, no stack traces in production |
| Database | Supabase SDK only (parameterised); CHECK / FK / UNIQUE constraints; RLS enabled with no public policies (`database/migrations/001_auth_sessions.sql`); audit trail for auth events |

## Syllabus coverage (Units I–VI)

See the coverage map in [docs/syllabus-integration.md](docs/syllabus-integration.md). Highlights added for the final units: lazy-loaded routes, memoisation, custom hooks, Context-based dark mode and toasts, an error boundary, TypeScript types, an SSR demo (`npm run ssr:demo`), a static API docs site at `/docs`, a streamed CSV export, and an EventEmitter + fs event log.

## Repository layout

```
node-backend/    Express API (src/{config,middleware,routes,controllers,services,utils,validation}, tests/)
frontend/        React + Redux Toolkit + React Router + Tailwind (src/{pages,features,components,utils,services}, Vitest tests)
database/        schema.sql, seed.sql, migrations/001_auth_sessions.sql
docs/            IMPLEMENTATION_PLAN.md, testing-guide.md, syllabus-integration.md
php-demo/, academic-demos/   Stand-alone Unit I / III / IV syllabus demonstrations
taskorbit.postman_collection.json   API collection incl. login + attack scenarios
```

## Configuration

`node-backend/.env` (see `.env.example`):

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `production` enables `Secure` cookies, HSTS and hides error internals; refuses to boot on the demo DB |
| `FRONTEND_URL` | Comma-separated list of allowed browser origins (required in production) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | Live database / storage (server-side only) |
| `COOKIE_SAMESITE` | `lax` (default), `strict` or `none` (cross-site deployments; requires HTTPS) |
| `SESSION_IDLE_MINUTES`, `SESSION_ABSOLUTE_HOURS`, `SESSION_REMEMBER_DAYS` | Session lifetimes |
| `LOGIN_MAX_FAILURES`, `LOGIN_LOCK_MINUTES`, `AUTH_RATE_LIMIT_MAX`, `RATE_LIMIT_MAX` | Brute-force & flood controls |
| `TRUST_PROXY` | Number of reverse-proxy hops (so rate limiting sees the real client IP) |

### Going live on Supabase
1. Run `database/schema.sql`, then `database/migrations/001_auth_sessions.sql` in the SQL editor.
2. Create the first manager: insert one profile row with a bcrypt hash (`node -e "console.log(require('bcryptjs').hashSync('<strong password>', 12))"`) and role `project_manager`; further accounts are created in the UI (Worker Directory → *Add team member*).
3. Set the environment variables above, `NODE_ENV=production`, serve both apps over HTTPS.

## Testing

```bash
cd node-backend && npm test      # 349 Jest + Supertest tests
cd frontend     && npm test      # 89 Vitest + Testing Library tests
cd frontend     && npm run lint && npm run build
```

See [docs/testing-guide.md](docs/testing-guide.md) for the use-case matrix (control, unit, module, page and validation tests).
