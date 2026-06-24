# QuickOrder — Dashboard & Multi-Business Work Plan

Next block of work: an admin dashboard with login, two roles, multiple
businesses, menu management, and manager-generated pre-verified order links.
Builds on the finished customer flow (Phases 0–8).

## Decisions (locked)

- **Dashboard delivery** — `/admin` routes inside the existing React app (one
  codebase, one build).
- **Auth** — server **session cookies** (httpOnly), passwords hashed with
  **bcrypt**. Sessions persisted in Postgres.
- **Menu editing** — **full CRUD** (items, prices, availability, option
  groups/sauces). The menu moves from the seed file into the database, scoped
  per business.
- **Manager order link** — **single-use, expiring** link bound to a business +
  client phone. The customer self-orders with the phone already verified (no
  SMS).
- **Inventory** — each menu item **and each option/sauce** consumes tracked
  ingredients (a recipe). Stock is checked **only at order confirmation** and
  the order is **rejected if any ingredient is short**; on success stock is
  decremented. Scope is **essential**: ingredients, units, stock, recipes,
  decrement-on-order — no restock log or low-stock alerts yet.

## Roles

- **Superadmin** — manages all businesses, their menus, orders, and admin users.
- **Business admin** — sees only their own business: its orders, menu, and
  order links. Tenant isolation is enforced on every admin endpoint.

## Multi-tenancy model (decision)

- A new **Business** is the tenant. Menu and orders are **scoped to a business**
  (`business_id`).
- **Customers and addresses stay global** (a phone number is one person); an
  order references both its business and the customer. Verification tokens stay
  global (keyed by phone).
- Menu **option groups are stored as JSONB** on the menu item (one column),
  keeping CRUD simple and matching the current data shape.
- **Inventory is per business.** Ingredients and recipes belong to a business;
  a **recipe component** links a menu item (its base) or one of its options to
  an ingredient + quantity. Stock math is `base recipe × qty + Σ(selected
  option recipes × qty)` per line.

---

## Phase 9 — Multi-tenant foundation + menu in the database

**Goal:** introduce businesses and move the menu into per-business DB tables.

- Entities: **Business** (`id`, `name`, `slug` unique, `phone`, `timezone`,
  `active`, timestamps) and **MenuItem** (DB-backed: `business_id`, `name`,
  `description`, `priceCents`, `category`, `available`, `sortOrder`,
  `optionGroups` JSONB).
- Add `business_id` to `orders` and `draft_orders`.
- Migration + an idempotent **seeder** that creates the *Alita Mía* business and
  inserts its current menu (from `menu.data.ts`) as rows.
- `MenuService` reads from the DB by business; keep its method shape so order
  pricing is unaffected. Public endpoint becomes business-scoped:
  `GET /api/b/:businessSlug/menu`.
- Draft creation and order confirm carry the business.

**Deliverables:** Business + DB menu, seeded Alita Mía, business-scoped menu API.

## Phase 10 — Customer app becomes business-aware

**Goal:** the mobile app loads a specific business by URL.

- Route the customer app by business: `/(b)/:businessSlug` (QR/menu link). The
  app resolves the business, loads its menu, and tags the draft/order with it.
- A small BusinessContext holds the active business for the cart/checkout.
- Existing single-business behaviour becomes "Alita Mía" via its slug.

**Deliverables:** business-scoped customer routes; menu + checkout carry the
business end to end.

## Phase 11 — Admin authentication (sessions + roles)

**Goal:** secure login for dashboard users.

- **AdminUser** entity (`email` unique, `passwordHash`, `role`
  `superadmin|business_admin`, `business_id` nullable for superadmin, `name`,
  `active`).
- Session auth: `express-session` + a Postgres session store
  (`connect-pg-simple`), Passport **local strategy**, bcrypt password checks.
- Endpoints: `POST /api/auth/login`, `POST /api/auth/logout`,
  `GET /api/auth/me`.
- Guards: `AuthenticatedGuard`, `RolesGuard`, and a **TenantGuard** that pins a
  business_admin to their `business_id` (superadmin may target any business).
- Seed an initial superadmin (credentials via env).
- `/admin` login page + auth context + protected layout in the React app.

**Deliverables:** working login/logout, role + tenant guards, seeded superadmin,
admin shell.

## Phase 12 — Dashboard: orders

**Goal:** businesses see and manage their orders.

- Admin endpoints (guarded, tenant-scoped): list orders for a business with
  filters (status, date, fulfilment), get one, and update **status**
  (`received → preparing → ready → completed`).
- `/admin/orders` UI: list with live-ish status, order detail (items, options,
  address, payment), status controls. Superadmin gets a business switcher.
- Optional: a "live" view that refreshes (kitchen board).

**Deliverables:** order list/detail/status management per business.

## Phase 13 — Dashboard: menu management (CRUD)

**Goal:** edit the menu from the dashboard.

- Guarded, tenant-scoped CRUD: create/update/delete menu items; toggle
  availability; edit prices; edit categories; edit **option groups** (incl.
  sauces) as structured JSON with validation (min/max, unique ids).
- `/admin/menu` UI: item list, item editor (fields + option-group editor),
  reorder, availability toggles.
- Server-side validation reuses the catalogue invariants from the customer flow.

**Deliverables:** full menu CRUD UI + endpoints.

## Phase 14 — Inventory & recipes

**Goal:** track ingredient stock and consume it when orders are placed.

- Entities (per business): **Ingredient** (`business_id`, `name`, `unit`
  e.g. `gr|ml|pza`, `stockQty` numeric, `active`) and **RecipeComponent**
  (`business_id`, `menu_item_id`, `scope` `base|option`, `option_group_id?`,
  `option_id?`, `ingredient_id`, `quantity`).
- Order confirm becomes **stock-aware** (in a DB transaction): compute required
  quantity per ingredient across the whole order
  (`base × qty + Σ option × qty`), **reject** with a clear error if any
  ingredient is short (block-at-confirm), otherwise **decrement** stock and save
  the order atomically.
- Dashboard `/admin/inventory`: list ingredients with current stock, edit stock
  (manual restock), create/disable ingredients. Recipe editing lives in the
  menu editor (Phase 13): per item, assign ingredients to the base and to each
  option.
- No auto-hiding of items, no restock history, no low-stock alerts this phase
  (the model leaves room to add them later).

**Deliverables:** ingredient + recipe model, stock check + atomic decrement on
confirm, inventory dashboard, recipe editor in the menu UI.

## Phase 15 — Manager pre-verified order links

**Goal:** a manager creates a link for a client by phone; the client orders with
the phone already verified.

- **ManagedSession** entity (`id`, `business_id`, `token` unique, `phone`,
  `expires_at`, `consumed_at`, `created_by`). Single-use + TTL.
- Admin endpoint: `POST /api/admin/order-links { phone }` → returns a shareable
  URL `/(b)/:slug/s/:token`.
- Customer side: opening the link resolves the business and the session; the
  backend **issues a verification grant** for that phone (reusing the existing
  grant machinery) **without SMS**, because the manager vouched. Phone is
  pre-filled and the OTP step is skipped.
- The session is **consumed** when the order is placed; expired/used links are
  rejected.

**Deliverables:** managed-session entity + endpoints, link generator UI, OTP-skip
checkout path.

## Phase 16 — Hardening, tests, docs

**Goal:** make it safe and maintained.

- **Tenant isolation tests** — a business_admin cannot read/modify another
  business's orders, menu, or links.
- **Auth tests** — login, password hashing, role/tenant guards, session expiry.
- **Managed-session tests** — single-use, expiry, grant issuance, OTP skip.
- **Security pass** — authz on every admin route, CSRF protection for cookie
  auth, rate-limit login, strong session secret, least-privilege superadmin
  seeding.
- **Docs** — update README + `docs/ARCHITECTURE.md` (multi-tenancy, auth model,
  managed sessions).

**Deliverables:** tests green, security review, updated docs.

---

## New / changed API surface (summary)

| Method | Path                              | Who            | Purpose                          |
|--------|-----------------------------------|----------------|----------------------------------|
| GET    | `/api/b/:slug/menu`               | public         | Business menu                    |
| POST   | `/api/auth/login` / `logout`      | admin          | Session login/logout             |
| GET    | `/api/auth/me`                    | admin          | Current user + role + business   |
| GET    | `/api/admin/orders`               | admin (tenant) | List business orders             |
| PATCH  | `/api/admin/orders/:id/status`    | admin (tenant) | Advance order status             |
| GET/POST/PUT/DELETE | `/api/admin/menu[...]`| admin (tenant) | Menu CRUD (incl. recipes)        |
| GET/POST/PUT | `/api/admin/inventory[...]`  | admin (tenant) | Ingredients + stock              |
| POST   | `/api/admin/order-links`          | admin (tenant) | Create pre-verified link         |
| GET    | `/api/sessions/:token`            | public         | Resolve a managed session        |
| (CRUD) | `/api/admin/businesses`, `/users` | superadmin     | Manage tenants + admin users     |

## Data model additions

- **Business** (tenant) → owns **MenuItem[]** (optionGroups JSONB), **Order[]**,
  **Ingredient[]**, and **RecipeComponent[]**.
- **AdminUser** (`role`, `business_id?`).
- **ManagedSession** (business + phone, single-use, TTL).
- **Ingredient** (`unit`, `stockQty`) and **RecipeComponent** (item/option →
  ingredient + quantity).
- `orders`, `draft_orders` gain `business_id`. Customers/addresses stay global.

## Sequencing & dependencies

- Phase 9 unblocks everything (businesses + DB menu).
- Phase 10 depends on 9 (customer app needs business routing).
- Phase 11 (auth) is independent of 10 and can run in parallel after 9.
- Phases 12–13 depend on 11 (guards) and 9 (DB menu/orders).
- Phase 14 (inventory) depends on 9 (DB menu) and 13 (recipe editing in the menu
  UI); its stock check hooks into the existing order-confirm flow.
- Phase 15 depends on 9 (business), 11 (admin), and the existing grant machinery.
- Phase 16 last.

## Out of scope (this block)

Online payments, push/WhatsApp status notifications to customers, per-business
theming/branding, analytics/reporting, multi-language admin, billing/plans.
