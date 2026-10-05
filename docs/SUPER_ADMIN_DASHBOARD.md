# Poultry Sathi — Super Admin Dashboard (Company Console)

Screen spec for the **Poultry Sathi company console**. This is the dashboard company staff use to run the whole SaaS: every shop (tenant), every plan, every Razorpay payment, every shop user.

Reviewed against the code as of Sep 2026.

- Frontend: `poultry-managment-frontend` (Next.js, port `3002`)
- Backend: `poultry-managment-backend` (NestJS, `/api/v1`, port `3001`)
- Related: [ARCHITECTURE.md](../ARCHITECTURE.md)

---

## 1. What exists today

Poultry Sathi is a **multi-tenant SaaS**. Each registered business is one row in `tenants`. That shop’s users (`admin` / `manager` / `staff`) only see their own data because `TenantInterceptor` sets `tenant_id` from the JWT.

Today’s `role = admin` is **shop owner**, not company owner. There is **no** `super_admin` role, **no** `/super-admin` UI, and **no** API that lists all tenants.

### Shop screens already built (do not copy these into Super Admin)

These belong to one shop. Super Admin does not get a second godown, sales, or ledger.

| Area | Routes |
|---|---|
| Dashboard | `/dashboard` |
| Godown | `/inventory`, `/godown/stock-ledger`, `/godown/inward-entry`, `/godown/sale`, `/bird-returns` |
| Purchases | `/purchases`, `/purchases/payment-out/voucher` |
| Sales | `/sales`, `/sales/payment-in/voucher`, `/sales/bird-returns` |
| Mortality / expenses | `/mortality`, `/expenses`, `/expenses/categories` |
| Master data | `/farmers`, `/retailers`, `/vehicles` (also `/products`, `/cage-tracking` exist) |
| Accounting | `/billing/balance-sheet`, `/billing/ledger/farms`, `/billing/ledger/retailers`, `/billing/ledger/company-report`, `/billing/reports/outstanding`, `/billing/reports/collection`, `/billing/reports/pending-purchases` |
| Reports | `/reports`, `/financial-analytics` |
| Users | `/users` |
| Shop subscription | `/subscription` (shop pays Poultry Sathi) |
| Settings | `/settings/general`, `/communication`, `/security`, `/permissions`, `/developer` |
| Public | `/`, `/login`, `/signup`, `/pricing`, `/business-setup`, `/features`, `/about`, `/contact` |

RBAC resources that drive the shop sidebar: `dashboard`, `purchases`, `sales`, `godown`, `mortality`, `expenses`, `reports`, `billing`, `farmers`, `retailers`, `vehicles`, `users`, `settings`.

### SaaS billing already built (shop side only)

Plans live in `src/subscriptions/plans.ts` (paise):

| Plan | Monthly | Yearly | How they pay |
|---|---|---|---|
| Starter | ₹999 | ₹9,990 | Razorpay Checkout |
| Professional | ₹2,499 | ₹24,990 | Razorpay Checkout |
| Enterprise | Custom | Custom | Contact sales (no checkout in code) |

New tenant gets a **14-day trial** (`SUBSCRIPTION_TRIAL_DAYS`). Status values: `trial`, `active`, `past_due`, `expired`, `cancelled`. Access is blocked with `403 SUBSCRIPTION_REQUIRED` when `tenantCanAccessApp()` is false.

Shop APIs only:

- `GET /subscriptions/me`
- `POST /subscriptions/create-order`
- `POST /subscriptions/verify`
- `POST /subscriptions/webhook` (public, HMAC)

Data already stored:

- `tenants`: name, type, phone, email, address, currency, country_code, status, plan, billing_period, subscription_status, trial_ends_at, current_period_ends_at
- `subscription_payments`: tenant, plan, period, amount_paise, razorpay order/payment id, status (`created` / `captured` / `failed`)
- `users`: name, phone, email, role, tenant_id, status, last_login, 2FA flags
- `audit_logs`, `communication_logs`, `failed_jobs` (accounting)

### Auth constraint that Super Admin must respect

JWT: `{ sub, email, phone, role, tenantId, sessionToken }`.

A user with `tenant_id = null` is allowed only on health, auth, tenants, and the Razorpay webhook (`TenantInterceptor` allowlist). Every other route returns “Create your business shop first”.

So Super Admin **cannot** reuse shop APIs. New routes under `/api/v1/super-admin/*` must be allowlisted and guarded by `role === super_admin`.

---

## 2. Who Super Admin is

| | Shop admin | Super Admin |
|---|---|---|
| Who | Customer who owns one poultry business | Poultry Sathi employee |
| `users.role` | `admin` | `super_admin` |
| `users.tenant_id` | Required | **NULL** |
| Sees | One shop | All shops |
| Login | `/login` | `/super-admin/login` |
| Layout | `DashboardLayout` (“Poultry Sathi”) | New `SuperAdminLayout` (“Poultry Sathi Console”) |

A shop admin opening `/super-admin/*` gets 403. A super admin opening `/dashboard` is sent to the console, not into a shop.

---

## 3. Screens to build

Ten screens. Routes live under `/super-admin`. Left nav, environment chip (staging / prod), logged-in name, logout.

```
/super-admin/login
/super-admin                         Overview
/super-admin/tenants                 All businesses
/super-admin/tenants/[id]            One business
/super-admin/billing                 All SaaS payments
/super-admin/billing/plans           Plan catalogue (phase C)
/super-admin/users                   All shop users
/super-admin/staff                   Company staff
/super-admin/communications          SMS / email
/super-admin/ops                     Health, jobs, audit
/super-admin/settings                Platform settings
```

Visual language stays the same green as the shop app so it feels like one product. Title must say **Console** so nobody thinks they are inside a shop.

---

### Screen 1 — Login

**Route:** `/super-admin/login`

**Who:** Poultry Sathi staff only.

**On the screen**

- Phone number
- Send OTP / enter OTP (same OTP flow as shop login)
- If the user has 2FA on, TOTP step after OTP
- Error if the phone is not `super_admin` (“This login is for Poultry Sathi staff”)
- No signup link. No “create shop” link.

**Rules**

- Shop `admin` / `manager` / `staff` cannot enter, even with a valid OTP.
- Seed the first super admin with a script (phone you control). Do not put that phone in git.
- Public `/signup` must never create `super_admin`.

---

### Screen 2 — Overview (home)

**Route:** `/super-admin`

**Purpose:** One glance at the whole platform. This is the page opened every morning.

**KPI tiles** (switch: today / 7 days / 30 days)

| Tile | Source |
|---|---|
| Total businesses | `tenants` count |
| Active / trial / suspended / expired | `tenants.status` + `subscription_status` |
| New signups | `tenants.created_at` |
| Total shop users | `users` where `role != super_admin` |
| Collected revenue | sum of `subscription_payments.amount_paise` where `status = captured` |
| MRR estimate | active monthly plans + yearly/12 |
| Trials ending in 7 days | `subscription_status = trial` and `trial_ends_at` within 7 days |
| Failed payments | `subscription_payments.status = failed` in the range |
| Failed accounting jobs | `failed_jobs` count |

**Charts**

- Signups per day (line)
- Mix: trial vs paid vs expired (donut)
- Plan mix: Starter / Professional / Enterprise / none (bar)

**Lists under the charts**

- Latest 10 signups (name, phone, plan, status, created)
- Trials ending soon (name, days left, link to tenant)
- Latest failed payments (tenant, amount, date)

No shop P&L, no bird counts, no godown stock on this page.

---

### Screen 3 — Businesses (tenant list)

**Route:** `/super-admin/tenants`

**Purpose:** Find any shop and act on it.

**Filters**

- Search: name, phone, email
- Status: active / suspended (tenant `status`)
- Subscription: trial / active / past_due / expired / cancelled / none
- Plan: starter / professional / enterprise / none
- Created date range

**Table columns**

| Column | Field |
|---|---|
| Business | `tenants.name` |
| Phone / email | `phone`, `email` |
| Type | `type` |
| Plan | `plan` + `billing_period` |
| Subscription | `subscription_status` |
| Trial / period end | `trial_ends_at` or `current_period_ends_at` |
| Shop status | `status` (active / suspended) |
| Created | `created_at` |

**Row actions**

- Open detail
- Suspend / reactivate
- Extend trial (date picker → `trial_ends_at`)
- Assign plan (plan + monthly/yearly + period end) for bank transfer or Enterprise
- Mark cancelled

Pagination. Default sort: newest first.

---

### Screen 4 — Business detail

**Route:** `/super-admin/tenants/[id]`

**Purpose:** Everything company staff need about one shop, without opening their invoices.

**Header**

- Name, type, status badge, subscription badge
- Buttons: Suspend, Reactivate, Extend trial, Assign plan, Cancel subscription

**Tab: Profile**

- Name, type, phone, email, address, currency, country code
- Created / updated
- Read-only in v1. Editing shop name is optional later.

**Tab: Subscription**

- Plan, billing period, status
- Trial end, current period end
- Manual form: plan, period, new period end, reason (required). Writes `tenants` and an audit row.
- This is how Enterprise and offline payments get access without Razorpay.

**Tab: Payments**

- This tenant’s rows from `subscription_payments`
- Date, plan, period, amount (₹), order id, payment id, status
- Button: Mark paid (offline). Fields: amount, plan, period, note. Status becomes `captured`, period end is extended, audit row written. Razorpay ids can be blank or `manual-<id>`.

**Tab: Users**

- Users where `tenant_id = this tenant`
- Name, phone, email, role, status, last login, 2FA on/off
- Actions: deactivate / activate, reset 2FA (clears secret + backup codes)
- Do not show password hashes.

**Tab: Usage**

Counts only, last 30 days. Not a dump of farmer phones or invoices.

- Farmers, retailers, vehicles
- Sales count, purchase count
- Last activity (max `updated_at` or last user login)

**Tab: Activity**

- Platform actions on this tenant (suspend, plan change, mark paid, user deactivate)
- From `platform_audit_logs` (new table, see §5)

---

### Screen 5 — SaaS payments

**Route:** `/super-admin/billing`

**Purpose:** All money Poultry Sathi collected, across every shop.

**Filters:** date, plan, status (`created` / `captured` / `failed`), tenant search.

**Table**

| Column | Notes |
|---|---|
| Date | `created_at` |
| Business | join `tenants.name` |
| Plan | starter / professional |
| Period | monthly / yearly |
| Amount | `amount_paise / 100` in ₹ |
| Razorpay order | `razorpay_order_id` |
| Razorpay payment | `razorpay_payment_id` |
| Status | badge |

**Summary strip:** captured total, failed count, created (unpaid orders) count for the filter.

**Not in v1:** refunds, settlements, GST invoice PDF, coupons. Those stay in the Razorpay dashboard until a later phase.

---

### Screen 6 — Plan catalogue

**Route:** `/super-admin/billing/plans`  
**Phase:** C (prices stay in `plans.ts` until then)

**On the screen**

- Starter and Professional: monthly and yearly price in ₹, active toggle
- Enterprise: “Contact sales” flag, no checkout amount
- Feature bullets shown on the public pricing page (read/edit later)

Changing a price must not rewrite old `subscription_payments`. New checkouts use the new amount.

---

### Screen 7 — Shop users (all tenants)

**Route:** `/super-admin/users`

**Purpose:** Find a person when support has a phone number, across every shop.

**Filters:** search name / phone / email, role (`admin` / `manager` / `staff`), status, tenant, 2FA on/off.

**Table:** name, phone, email, role, business name, status, last login, 2FA.

**Actions:** deactivate, activate, reset 2FA. Link to that tenant’s detail.

Exclude `super_admin` rows (those live on Screen 8).

---

### Screen 8 — Company staff

**Route:** `/super-admin/staff`

**Purpose:** Who inside Poultry Sathi can open this console.

**On the screen**

- List: name, phone, email, 2FA, last login, status
- Invite: name + phone (and optional email). Creates `users` with `role = super_admin`, `tenant_id = null`, `status = active`.
- Deactivate a staff user.
- Block: cannot deactivate the last active super admin.
- 2FA required before they can change tenants or payments (v1: show a warning if 2FA is off; phase B: block mutating actions until 2FA is on).

---

### Screen 9 — Communications

**Route:** `/super-admin/communications`

**Purpose:** See what the platform already sent, and message a shop owner.

**Tab: Logs** (phase B)

- `communication_logs` across tenants
- Recipient, channel (email / sms), message type, status (sent / failed), error, sent at, tenant name
- Filter by channel, status, tenant, date

**Tab: Message owner** (phase B)

- Pick a tenant
- Channel: email or SMS
- Short message
- Sends with existing SES / SNS and writes a log row
- Recipient is the tenant phone/email, not every farmer of that shop

**Tab: Broadcast** (phase C)

- Audience: all active owners, or trial ending in 7 days, or a chosen plan
- Confirm count before send
- Opt-out is later; v1 of broadcast is manual and audited

---

### Screen 10 — Operations

**Route:** `/super-admin/ops`

**Purpose:** Is the platform healthy, and what failed.

**Blocks**

- API health from `GET /health` (ok / down, checked on load)
- Environment: staging vs prod (from frontend env, display only)
- Failed accounting jobs: id, tenant, error, created. Retry button can wait for phase C.
- Audit: filter `audit_logs` by tenant, action, date. This is shop-user audit (login, create, update). Platform staff actions are on the tenant Activity tab (`platform_audit_logs`).

No server secrets, no `.env`, no Razorpay key secret on this page. Show only “Razorpay: test” or “Razorpay: live” from a boolean the API returns.

---

### Screen 11 — Platform settings

**Route:** `/super-admin/settings`

**On the screen**

- Default trial days (today: env `SUBSCRIPTION_TRIAL_DAYS`, default 14). Editing this changes **new** signups only.
- Razorpay mode indicator (test / live). Keys stay on the server.
- Support contact shown on Enterprise “contact sales” (email / phone).

Feature flags are optional and not required for v1.

---

### Later — Impersonation (not a nav item in v1)

From tenant detail, “View shop” issues a short-lived JWT with `impersonatorId` + target `tenantId`.

Shop UI shows a banner: “Viewing {shop name} — Exit”. Exit returns to the console. That token cannot call `/super-admin/*`. Every write during impersonation is audited.

Do not build this in phase A. Support can read usage counts until then.

---

## 4. What each phase ships

### Phase A — first release

- Screen 1 Login
- Screen 2 Overview (counts + 3 charts + 3 short lists)
- Screen 3 Tenant list
- Screen 4 Tenant detail: profile, subscription actions, payments list (read), users list (read)
- Screen 5 Payments list (read)
- Backend: `super_admin` role, `SuperAdminGuard`, overview + tenants + payments read, suspend / extend trial / assign plan

### Phase B — money and support

- Mark paid (offline) on tenant detail
- Screen 7 full actions (deactivate, reset 2FA)
- Screen 9 logs + message owner
- Screen 10 health + failed jobs
- Screen 8 invite / deactivate staff
- `platform_audit_logs` shown on tenant Activity tab

### Phase C — polish

- Screen 6 plan catalogue (move prices out of `plans.ts`)
- Broadcast
- Impersonation
- Job retry

---

## 5. Backend to add

All routes: `JwtAuthGuard` + `SuperAdminGuard`. Prefix `/api/v1/super-admin`. Add this prefix to the `TenantInterceptor` allowlist so a null `tenant_id` is allowed **only** here.

| Method | Path | Screen |
|---|---|---|
| POST | `/super-admin/auth/send-otp` | Login |
| POST | `/super-admin/auth/verify-otp` | Login. Reject if role is not `super_admin` |
| GET | `/super-admin/overview` | Overview |
| GET | `/super-admin/tenants` | List. Query: search, status, subscription, plan, page |
| GET | `/super-admin/tenants/:id` | Detail + usage counts |
| PATCH | `/super-admin/tenants/:id` | status, plan, billingPeriod, trialEndsAt, currentPeriodEndsAt, subscriptionStatus |
| GET | `/super-admin/payments` | All payments |
| POST | `/super-admin/payments/manual` | Offline mark paid (phase B) |
| GET | `/super-admin/users` | Shop users |
| PATCH | `/super-admin/users/:id` | status, reset 2FA |
| GET / POST | `/super-admin/staff` | Company staff |
| PATCH | `/super-admin/staff/:id` | deactivate |
| GET | `/super-admin/communications` | Logs |
| POST | `/super-admin/communications/send` | Message owner |
| GET | `/super-admin/jobs` | Failed accounting jobs |
| GET | `/super-admin/audit` | Shop audit logs |
| GET | `/super-admin/health` | Wrapped health + razorpay mode flag |

New table:

```
platform_audit_logs
  id, actor_user_id, action, target_type, target_id,
  payload jsonb, created_at
```

Every PATCH and every manual payment writes one row. `payload` stores old and new values (plan, dates, status). Never store OTP, JWT, or Razorpay secrets.

Later table `saas_plans` (phase C): `code`, `name`, `monthly_paise`, `yearly_paise`, `active`, `features jsonb`.

---

## 6. Security

1. Guard checks `role === super_admin` on every console API. Shop JWT is rejected.
2. Mutating calls write `platform_audit_logs` (who, what, old value, new value).
3. Signup cannot create `super_admin`.
4. First account is seeded by script, not committed.
5. Impersonation tokens (phase C) cannot call `/super-admin/*`.
6. UI never renders `RAZORPAY_KEY_SECRET`, `JWT_SECRET`, or AWS keys.
7. Suspended tenant: shop `status = suspended` must fail their APIs the same way a dead subscription does (extend `tenantCanAccessApp` or the interceptor). Assigning a plan with a future `current_period_ends_at` and `subscription_status = active` must let that shop back in without Razorpay.

---

## 7. Done when (v1 / Phase A)

- Super admin logs in at `/super-admin/login`. A shop admin cannot.
- Overview shows every tenant, not one shop.
- Suspending a tenant blocks that shop’s APIs.
- Assigning Professional with a period end 30 days out lets that shop in without Razorpay.
- Payments table matches `subscription_payments`.
- Shop users still only see their own `tenant_id`. Nothing in this console widens shop JWTs.

Implementation starts at Phase A after this spec is accepted.
