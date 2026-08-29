# QuickOrder backend (Laravel)

A from-scratch Laravel port of the original NestJS/Postgres backend, built
specifically to run on ordinary shared/cPanel hosting: PHP + MySQL, no
Docker, no separate Node process.

The route contract is unchanged — every endpoint, method, and JSON shape
matches the original API exactly (see the table in the project's main
README), so the existing React frontend and the Expo owner-app work against
this backend without any changes on their end.

## Stack

- **Framework** — Laravel 11, PHP 8.2+.
- **Database** — MySQL/MariaDB via Eloquent (UUID primary keys, JSON columns
  for menu option groups / order line snapshots).
- **Auth** — Laravel session auth (the `web` guard) + Sanctum's stateful-SPA
  mode, so the admin dashboard keeps working with a plain cross-origin
  session cookie, the same as before.
- **Sessions** — `SESSION_DRIVER=database` (a `sessions` table, created by
  migration), replacing the old Postgres-only `connect-pg-simple` store.

## What changed from the NestJS version, deliberately

- **Database**: Postgres → MySQL. Every entity's `uuid`/`jsonb`/`timestamptz`
  column type became MySQL's `char(36)`/`json`/`timestamp` — see
  `database/migrations/`.
- **Stock decrement now takes row locks** (`lockForUpdate()` in
  `InventoryService::consumeForOrder()`). The original NestJS version relied
  only on the surrounding transaction with no explicit lock, which is a
  real (if narrow) race window under concurrent orders for the same
  ingredient. This is a correctness improvement, not a behavior change users
  would notice.
- Everything else — pricing, the OTP/grant flow, multi-tenant scoping, the
  draft-order token lifecycle, inventory/recipe logic — is a line-for-line
  port of the original TypeScript, including the Spanish validation/error
  copy.

## Local development

```bash
composer install
cp .env.example .env
php artisan key:generate
# Point DB_* in .env at a local MySQL/MariaDB, then:
php artisan migrate
php artisan db:seed
php artisan serve
```

The seeder creates the same default business ("Alita Mía", slug
`alita-mia`) and menu as the old backend's `SeedService`, plus a superadmin
from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (defaults to
`admin@quickorder.local` / `changeme` — **change this in production**).

## Tests

```bash
composer install --dev
php artisan test
```

Runs against an in-memory SQLite database (see `phpunit.xml`) so no MySQL
server is needed just to run the suite. Covers the same cases as the old
Jest specs: order pricing, phone normalization, and the verification
grant/OTP flow (`tests/Unit`, `tests/Feature`).

## Deploying to shared/cPanel hosting

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full walkthrough —
document root, `.env`, migrations, and the WhatsApp notifier seam.
