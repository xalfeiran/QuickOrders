# QuickOrder

Mobile-first takeout ordering app. Visitors browse a restaurant menu, build a
cart, and place an order — no login required.

## Stack

- **Frontend** — React 18 + Vite, mobile-first. Served by nginx in production.
- **Backend** — NestJS microservice (TypeScript) exposing a REST API.
- **Database** — PostgreSQL 16, accessed via TypeORM (migrations, no auto-sync).
- **Runtime** — Docker Compose ties the three services together.

The codebase favours readability over cleverness: small files, plain names,
and comments only where intent isn't obvious from the code.

## Project layout

```
QuickOrder/
├── docker-compose.yml      # Runs db + frontend + backend together
├── .env.example            # Copy to .env and adjust
├── backend/                # NestJS API microservice
│   └── src/
│       ├── database/       # TypeORM data source + migrations
│       ├── menu/           # Menu catalogue (read-only)
│       ├── orders/         # Order intake + retrieval
│       └── health/         # Health check endpoint (incl. DB ping)
└── frontend/               # React (Vite) mobile UI
    └── src/
        ├── api/            # Backend HTTP client
        ├── cart/           # Cart state (React context)
        ├── components/     # Reusable UI pieces
        └── pages/          # Menu, Cart, Checkout, Confirmation
```

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

- Frontend → http://localhost:8080
- Backend  → http://localhost:3000/api
- Database → localhost:5432 (Postgres)

Compose starts Postgres first and waits for it to be healthy before the
backend boots. Data persists in the `quickorder-db-data` volume across
restarts.

## Local development (without Docker)

Start a Postgres instance and point `.env` at it (set `DB_HOST=localhost`).
A quick container-only database:

```bash
docker run --rm -e POSTGRES_USER=quickorder -e POSTGRES_PASSWORD=quickorder \
  -e POSTGRES_DB=quickorder -p 5432:5432 postgres:16-alpine
```

```bash
# Terminal 1 — backend
cd backend && npm install && npm run start:dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

## Database & migrations

The connection is defined once in `backend/src/database/data-source.ts` and
shared by the app and the TypeORM CLI. Schema changes go through migrations
(`synchronize` is off); pending migrations run automatically on startup.

```bash
cd backend
npm run migration:generate -- src/database/migrations/<Name>   # after editing entities
npm run migration:run                                          # apply pending
npm run migration:revert                                       # roll back the last one
```

## Tests

```bash
cd backend && npm test     # Jest unit tests (pricing, grants, OTP, phone util)
cd frontend && npm test    # Vitest unit tests (cart line keying / pricing)
```

## API overview

| Method | Path                          | Purpose                                            |
|--------|-------------------------------|----------------------------------------------------|
| GET    | `/api/health`                 | Liveness + DB connectivity                          |
| GET    | `/api/menu`                   | List menu items (with option groups)                |
| GET    | `/api/menu/:id`               | Get a single menu item                              |
| POST   | `/api/orders/draft`           | Start an order session → `{ orderToken }`           |
| GET    | `/api/orders/draft/:token`    | Check / resume a session                            |
| POST   | `/api/verify/request`         | Send a WhatsApp OTP (mocked — see logs)             |
| POST   | `/api/verify/confirm`         | Exchange a code for a verification grant            |
| GET    | `/api/customers/lookup?phone=`| Registered? + last address (grant-guarded)          |
| POST   | `/api/orders/confirm`         | Place the order (grant-guarded, re-priced)          |
| GET    | `/api/orders/:id`             | Look up an order (with lines + options)             |

### Customer flow

1. Browse the menu → tap an item → choose quantity + options → cart.
2. The cart mints an **order token** (`/orders/draft`) on the first item.
3. Checkout: verify phone (WhatsApp OTP) → pickup/delivery → address
   (prefilled for returning customers) → payment method → review.
4. `POST /orders/confirm` re-prices everything from the menu, saves the
   customer + address, and records the order.

> **Mocked WhatsApp:** the OTP isn't actually sent. The code is written to the
> backend logs: `WhatsApp(mock) Verification code for <phone>: <code>`. Watch
> `docker compose logs -f backend` (or the dev server) to read it.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the session-token and
phone-verification design.
