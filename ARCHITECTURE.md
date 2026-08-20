# Poultry Management System — Architecture Document

> Current state of the system (updated after the multi-tenant isolation work).

## 1. Overview

Poultry Management System ("Poultry Sathi") is a **multi-tenant** farm/business management app. Each business
(tenant) registers its own shop and manages its own poultry data — purchases, sales, godown (warehouse) stock,
bird mortality, expenses, billing/ledgers, farmers/retailers/vehicles, reports and financial analytics — completely
isolated from every other business.

```
                     ┌────────────────────────────┐
 Browser/User ──────▶│  Next.js App (React, SSR)  │  :3002  (dev)
                     │  app/ routes + lib/ api.ts  │
                     └─────────────┬──────────────┘
                                   │ REST / JSON   Authorization: Bearer <JWT>
                                   ▼
                     ┌────────────────────────────┐
                     │   NestJS API (backend)      │  :3001  /api/v1
                     │   Controllers + Services    │
                     │   TenantInterceptor (per-req)│
                     └─────────────┬──────────────┘
                                   │ TypeORM
                                   ▼
                     ┌────────────────────────────┐
                     │  PostgreSQL (AWS RDS)       │  poultry_stage
                     └────────────────────────────┘
```

## 2. Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | Next.js (App Router, React), Tailwind, Radix UI, shadcn-style components, framer-motion, antd (some pages), Recharts, Redux (debug/redux dir), TypeScript |
| Backend  | NestJS (NestFactory, TypeORM, Swagger), AWS SDK (SES/SNS for notifications), jsonwebtoken, multer (purchase attachments), TypeScript |
| DB       | PostgreSQL on AWS RDS (DB_SYNCHRONIZE=false, migrations applied manually) |
| Auth     | Phone + OTP (SMS via SNS / dev OTP), JWT access token (12h) + session token (DB-validated), optional 2FA (TOTP) |
| Deploy   | Node (dist/main.js on :3001), Next dev/prod on :3002 |

## 3. Repositories

- **Frontend**: `poultry-managment-frontend` (this repo)
  - `app/` — Next.js App Router pages (dashboard, sales, purchases, godown, billing, reports, settings, users, etc. + `(public)` marketing/auth pages)
  - `components/` — layout (dashboard-layout, public-layout), UI kit, shared widgets
  - `lib/` — `api.ts` (typed API client), `permissions.tsx` (RBAC context), `api-base-url.ts`, `billing-types.ts`, `billing-utils.ts`, `date-utils.ts`, `utils.ts`, `dev-mode.tsx`
- **Backend**: `poultry-managment-backend`
  - `src/app.module.ts`, `src/main.ts`
  - `src/<module>/` — one Nest module per domain (see §5)
  - `src/modules/accounting/` — integration with an external accounting service (queued retry)

## 4. Ports & Environment

| Item | Value |
|------|-------|
| Backend | `http://localhost:3001`  (global prefix from `API_PREFIX` = `api/v1`) |
| Frontend dev | `http://localhost:3002` |
| DB | PostgreSQL, database `poultry_stage`, user `poultry_user` |
| Swagger | `/api/v1/docs` (staging/development only) |
| Key envs | `PORT`, `API_PREFIX`, `DATABASE_URL` (or DB_HOST/PORT/USERNAME/PASSWORD/NAME), `DB_SYNCHRONIZE`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `AWS_*` (SES/SNS) |

Backend runs from compiled `dist/main.js` (changes require `npm run build` + restart). Logs:
`C:\Users\PC-ASUS\AppData\Local\Temp\opencode\backend.out.log` / `backend.err.log`.

## 5. Backend Modules (NestJS)

| Module | Responsibility |
|--------|----------------|
| `tenants` | Tenant entity + `TenantContextService` (AsyncLocalStorage) + `TenantInterceptor` (global). `POST /tenants` onboarding seeds settings + default role permissions. `GET /tenants/me`. **Global module.** |
| `auth` | Phone OTP login/register, email/password legacy login, JWT strategy, session validation, 2FA. |
| `users` | User CRUD, statistics. Auth-related lookups (`findOne/byEmail/byPhone/byIdentifier`) intentionally not tenant-scoped. |
| `permissions` | RBAC: role_permissions + user_permissions, per-tenant rows. `GET /permissions/my-permissions` drives the sidebar. |
| `settings` | Per-tenant key/value settings (composite PK `(tenant_id, key)`). |
| `farmers` `retailers` `vehicles` `products` | Master entries (tenant-scoped). |
| `purchases` | Purchase orders + items + payments + uploads (tenant-scoped). |
| `sales` | Sales invoices, invoice numbering, sale payments, bird returns, vehicle bird returns (tenant-scoped). |
| `godown` | Warehouse: inward entries, godown sales + payments, godown mortality, godown expenses, stock ledger, summary. |
| `cages` | Cage tracking (from purchase, in-godown, on-vehicle, sold). |
| `mortality` | Bird mortality records + stats. |
| `expenses` `expense-categories` | Expense management. (Note: `expense_categories` NOT tenant-scoped yet.) |
| `billing` | Parties (farmer/retailer), payments, ledger, opening balances, company report, vouchers. |
| `payment-vouchers` | Payment in/out vouchers + integration with accounting. |
| `dashboard` | KPIs, revenue/product/expense trends, financial summary, inventory & purchase summaries. |
| `reports` | Purchase/sales/mortality/profit-loss/gross-profit/outstanding/collection + raw-SQL reports (tenant-filtered). |
| `inventory` | Inventory items + stock levels. |
| `audit` | Audit logs. |
| `notifications` | Email/SMS via AWS SES/SNS + `communication_logs`. |
| `modules/accounting` | External accounting sync client, mapper, retry service, failed-jobs. |
| `health` | Health check (public). |

### Controllers & Auth Guarding

- Auth/login/OTP/register/health endpoints are **public**.
- All business-data controllers are guarded with `@UseGuards(JwtAuthGuard)` (class level):
  `auth(protected ones), tenants, users, farmers, retailers, vehicles, products, purchases, sales, godown, cages, mortality, expenses, expense-categories, billing, payment-vouchers, permissions, reports, dashboard, inventory, settings, audit, notifications, accounting, bird-returns, vehicle-bird-returns`.
- `health` remains public.

## 6. Multi-Tenancy Design (core)

### 6.1 Concept
Every business is a `Tenant` row. Users belong to exactly one tenant via `users.tenant_id`.
`tenant_id` is added to every business table. All reads/writes in business modules are scoped to the
tenant of the authenticated request.

### 6.2 Tenant Context propagation
```
HTTP request (with JWT)
  → JwtAuthGuard validates token, sets req.user (userId, role, tenantId)
  → TenantInterceptor (registered as APP_INTERCEPTOR in TenantsModule, runs for every route)
      → req.user.tenantId ?? null
      → TenantContextService.run(tenantId, () => next.handle())
      → AsyncLocalStorage makes tenantId visible to all async service code
```
- `TenantContextService.getTenantId()` returns `string | null`.
- `tenantId` is read from the **DB** at every request (`jwt.strategy.validate` re-fetches the user), so a
  stale JWT never carries a wrong tenant.

### 6.3 Scoping helpers (used in every scoped service)
```ts
private getTenantId(): string | null        // from TenantContextService
private tenantWhere(extra): any             // { ...extra, tenantId } when tenantId != null, else extra
private applyTenant(query, alias)           // query.andWhere('alias.tenantId = :tenantId', {tenantId}) when tenantId != null
```
Rules followed during scoping:
- `find` / `findOne` use `tenantWhere({...})`.
- QueryBuilders use `applyTenant(query, 'alias')` **before** `getRawOne()`/`getMany()`/`getCount()`.
- Existing `.where()` date filters were converted to `.andWhere()` so they **don't wipe** the tenant condition.
- `create` sets `tenantId: this.getTenantId() ?? undefined`.
- Raw SQL reports inject `tenant_id = '<id>'` filters into WHERE/JOIN clauses.

### 6.4 Onboarding flow
```
User registers (phone + OTP)            → user created with role 'admin', tenant_id = NULL
User lands on /business-setup
POST /api/v1/tenants {name, type, ...}  (JWT: tenantId=null)
  → Tenant row created
  → seedDefaultSettings(tenantId)       (farmName, businessType, currency, countryCode, theme, businessCreated, …)
  → seedDefaultRolePermissions(tenantId)(admin/manager/staff × 13 resources)
  → attachTenant(userId, tenantId)      → user.tenant_id set, fresh JWT issued with tenantId
User is redirected to /dashboard        → now sees ONLY their own business data
```

### 6.5 Role permissions (drives UI)
- `role_permissions` unique on `(tenant_id, role, resource)` — each tenant has its own matrix.
- Default matrix seeded on tenant creation: `admin` (all CRUD all), `manager`, `staff`.
- `GET /permissions/my-permissions` merges user-specific + role permissions and returns the resource map
  the frontend uses to render/hide the sidebar and block access.
- `admin` role bypasses permission checks entirely (`isAdmin` → allow all).

## 7. Authentication & Authorization

1. **Register/Login** — phone + OTP. `send-otp` (rate-limited, ~60s cooldown per phone; dev returns
   `devOtp`), `verify-otp` → creates session, returns JWT.
2. **Session** — every login stores a `session_token`; the JWT strategy validates it against the DB on each
   request (`validateSession`). Logout/logins rotate it.
3. **JWT** — payload `{ sub, email, phone, role, tenantId, sessionToken }`, signed with `JWT_SECRET`, 12h.
4. **2FA** — optional TOTP (generate/turn-on/authenticate/turn-off/admin-reset).
5. **RBAC** — `permissions` module + `PermissionsGuard`/`@Permissions` decorators on some controllers;
   frontend gates navigation via `lib/permissions.tsx`.

## 8. Frontend Architecture

- **App Router**: `app/(public)/*` = marketing + login/signup/business-setup; `app/<module>/*` = authenticated pages.
- **Layouts**: `components/dashboard-layout.tsx` wraps authenticated pages — sidebar is permission-driven
  (`canRead(resource)`), guards direct URL access (redirects to `/dashboard` or `/settings` when denied).
- **API client**: `lib/api.ts` — typed `apiRequest<T>()` (adds `Authorization: Bearer <token>` from
  `localStorage.token`, JSON parsing, dev-mode logging). Exposes per-module API objects
  (`farmersApi`, `salesApi`, `billingApi`, `permissionsApi`, `tenantsApi`, `settingsApi`, …).
- **Auth state**: `localStorage.token` + `localStorage.user` (id, email, phone, role, tenantId).
- **Permissions**: `lib/permissions.tsx` `PermissionsProvider` + `usePermissions()` → fetches
  `/permissions/my-permissions` (admins skip fetch).
- **Business onboarding**: `app/(public)/business-setup/page.tsx` calls `tenantsApi.create(...)`, stores the
  re-issued token/user, sets `business_created`, redirects to `/dashboard`.

### Key pages
`/dashboard`, `/sales*`, `/purchases*`, `/godown*`, `/inventory`, `/bird-returns`, `/mortality`, `/expenses`,
`/farmers`, `/retailers`, `/vehicles`, `/products`, `/cage-tracking`, `/billing*`, `/reports*`,
`/financial-analytics`, `/accounting`, `/settings`, `/users`, `/api-docs`, `/debug`, `/redux` (dev).

## 9. Data & Known Constraints

- DB runs with `DB_SYNCHRONIZE=false` → schema changes need manual SQL/migrations.
- `tenants` table had a sequence bug (migration inserted `id=1` explicitly) — fixed via
  `setval(pg_get_serial_sequence('tenants','id'), (SELECT COALESCE(MAX(id),1) FROM tenants))`.
- `role_permissions` unique index moved to `(tenant_id, role, resource)` (was global `(role, resource)` which
  blocked per-tenant rows).
- `communication_logs` table was missing (no migration) — created manually to match the entity.
- `expense_categories` is not tenant-scoped yet (known gap).
- Child tables (`sale_payments`, `purchase_order_items`, `purchase_order_payments`, `godown_sale_payments`)
  are not tenant-scoped (known gap) — but unreachable without tenant-scoped parent data.
- `health` is intentionally public; all other business endpoints require a valid JWT.
- Frontend must **refresh/re-login** after backend changes so `localStorage.token` is not stale.

## 10. Common Commands

```bash
# Backend
cd poultry-managment-backend
npx tsc --noEmit        # typecheck
npm run build           # compile to dist/
node dist/main.js       # run (or npm run start:dev for watch)

# Frontend
cd poultry-managment-frontend
npm run dev             # dev server on :3002
npx tsc --noEmit        # typecheck
```
