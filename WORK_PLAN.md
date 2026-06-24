# QuickOrder — Customer Order Flow Work Plan

Phased plan to implement the full customer ordering journey on top of the existing scaffolding.

## Decisions (locked)

- **WhatsApp OTP** — mocked this phase. Backend generates the token and logs it; a `WhatsAppNotifier` interface keeps the seam clean so a real provider (Cloud API / Twilio) drops in later.
- **Payment** — capture method only (`cash` or `card`). No online charge or gateway.
- **Persistence** — real **Postgres**, added as a Docker Compose service. Replaces the in-memory stores so registered-customer / last-address lookup survives restarts. ORM: **TypeORM** (NestJS-idiomatic, matches the existing decorator + DI style).

## Target customer journey

1. Home → browse menu.
2. Tapping a menu item **starts an order session** → a unique **order token** is created (held client-side, persisted server-side as a draft).
3. Item detail: choose **quantity** and **customize** (option groups / modifiers) → add to cart.
4. **Floating cart banner** pinned to the bottom shows item count + total; tap to expand/review.
5. **Checkout**:
   a. Enter **phone number**.
   b. Choose **pickup** or **delivery**.
   c. If the phone matches a **registered customer** → prefill their **last address**; otherwise collect a new address.
   d. **Verify phone** via the token sent over WhatsApp (mocked OTP).
   e. Confirm the **full delivery address** (delivery only).
   f. Choose **payment method**: cash or card.
6. Submit → confirmation screen.

---

## Current state (baseline)

- **Backend (NestJS / TS):** `menu` (hard-coded list), `orders` (in-memory `Map`), `health`. Orders carry `customerName`, `customerPhone`, `notes`, `items[]`, server-side pricing.
- **Frontend (React + Vite):** `MenuPage`, `CartPage`, `CheckoutPage`, `ConfirmationPage`; `CartContext` (in-memory, quantity-only, lines keyed by `menuItemId`); thin `api/client.js`.
- **Runtime:** Docker Compose with `frontend` + `backend`.

### Key gaps to close

- No menu **option groups / modifiers**; cart can't hold two variants of the same item.
- No **order token / draft order** concept.
- No **customer** entity, **address**, or registered-customer lookup.
- No **pickup/delivery**, **phone verification**, or **payment method**.
- No **floating cart banner**; checkout is a single name/phone/notes form.
- No **database**; everything resets on restart.

---

## Phase 0 — Foundations: database + shared types

**Goal:** stand up Postgres and the persistence layer before feature work.

- Add a `db` (Postgres 16) service to `docker-compose.yml` with a named volume; wire `DATABASE_URL` and credentials through `.env` / `.env.example`.
- Add TypeORM to the backend: `TypeOrmModule.forRoot(...)`, entities autoload, migrations enabled (no `synchronize` in prod).
- Define a shared price/money convention (already cents — keep it).
- Health check: extend `/api/health` to confirm DB connectivity.

**Deliverables:** compose `db` service, TypeORM config, first migration scaffold, green health check against the DB.

## Phase 1 — Menu customization model

**Goal:** menu items can carry customizable options; the API exposes them.

- Extend the menu model with **option groups**: `id`, `name`, `min`, `max`, `required`, and **options** (`id`, `name`, `priceDeltaCents`). Example: Soda → "Flavor" (required, choose 1: cola / lemon-lime / orange); Burger → "Add-ons" (optional, choose many: bacon +X, extra cheese +X).
- Move the menu from hard-coded array into seedable data (DB table or a seed file loaded at startup); keep `MenuService.findAll/findOne` signatures so callers don't break.
- `GET /api/menu` and `GET /api/menu/:id` return option groups.

**Deliverables:** menu entities + seed, updated DTOs/interfaces, API returns options.

## Phase 2 — Order token / draft order

**Goal:** initiating an order mints a unique token tied to a server-side draft.

- `POST /api/orders/draft` → creates a draft order, returns `{ orderToken }` (opaque UUID).
- Draft holds: token, status (`draft`), line items + chosen options, timestamps; TTL/cleanup for abandoned drafts.
- Frontend: on first "add to cart" (or first item tap), call draft endpoint once and keep `orderToken` in cart state; reuse for the rest of the session.
- Subsequent cart mutations sync to the draft (or sync once at checkout — pick one; recommend sync-at-checkout for simplicity, token created up front).

**Deliverables:** draft order entity + endpoint, token lifecycle, cart wired to a token.

## Phase 3 — Cart with customization + floating banner

**Goal:** customize each item, support variant lines, show a persistent bottom banner.

- **Item customization screen/modal:** quantity stepper + option-group controls (radio for choose-one, checkbox for choose-many), live price, "Add to cart".
- **CartContext rewrite:** line key = `menuItemId` + hash of selected options (so the same item with different options is a separate line); store `{ menuItemId, name, quantity, selectedOptions, unitPriceCents }`. Recompute totals including option price deltas.
- **FloatingCartBanner component:** fixed to bottom, hidden when empty; shows item count + total; tap → expand cart / go to review. Mobile-first, safe-area aware.
- Update `CartPage` to render variant lines and edit/remove.

**Deliverables:** customization UI, new cart model, floating banner, updated cart page.

## Phase 4 — Customers, addresses, registered lookup

**Goal:** phone-keyed customers with saved addresses; prefill last address.

- **Customer entity:** `id`, `phone` (unique), `name?`, `createdAt`. **Address entity:** linked to customer, full fields (street, number, interior, neighborhood, city, references, lat/lng optional), `lastUsedAt`.
- `GET /api/customers/lookup?phone=...` → returns whether registered + last address (only **after** phone verification — see Phase 5; never leak addresses to an unverified caller).
- On order submit, upsert customer + save/update address for next time.

**Deliverables:** customer + address entities/migrations, lookup endpoint (verification-gated), upsert on order.

## Phase 5 — Phone verification (mocked WhatsApp OTP)

**Goal:** verify the phone with a token "sent via WhatsApp".

- `POST /api/verify/request` `{ phone }` → generate 6-digit token, store hashed with short TTL + attempt limit, "send" via `WhatsAppNotifier` (mock logs it).
- `POST /api/verify/confirm` `{ phone, token }` → on success issue a short-lived **verification grant** (e.g. signed token / server session) required to read a saved address and to place the order.
- `WhatsAppNotifier` interface + `MockWhatsAppNotifier` impl; real provider is a future swap behind the same interface.
- Rate-limit requests; lock after N failed attempts.

**Deliverables:** verify request/confirm endpoints, OTP store with TTL + throttling, notifier seam, frontend OTP entry step.

## Phase 6 — Checkout flow (multi-step)

**Goal:** assemble the staged checkout described in the journey.

- Convert `CheckoutPage` into ordered steps: **Phone → (verify) → Pickup/Delivery → Address (prefilled if registered, delivery only) → Payment method → Review/Submit**. Back/forward navigation, per-step validation, progress indicator.
- `paymentMethod`: `cash` | `card` (method only).
- `fulfillmentType`: `pickup` | `delivery`; address required only for delivery.
- Submit `POST /api/orders/confirm` with `orderToken`, verification grant, fulfillment, address, payment method; backend re-prices from the menu (never trust client prices), upserts customer/address, sets status `received`.

**Deliverables:** stepped checkout UI, confirm endpoint, end-to-end happy path.

## Phase 7 — Backend order model + confirmation

**Goal:** persist the richer order and show it back.

- Extend `Order` entity: `fulfillmentType`, `addressId?`, `paymentMethod`, customizations per line, link to customer; statuses unchanged (`received`→…).
- `GET /api/orders/:id` returns the full order incl. options, fulfillment, payment.
- `ConfirmationPage`: show fulfillment type, address (delivery), payment method, per-line customizations, total.

**Deliverables:** order entity migration, enriched read endpoint, updated confirmation page.

## Phase 8 — Hardening, tests, docs

**Goal:** make it robust and readable (per project guidelines).

- **Backend tests:** pricing with option deltas, OTP request/confirm + throttle, verification-gated address lookup, draft→confirm, validation DTOs.
- **Frontend tests:** cart variant keying/totals, checkout step gating, banner visibility.
- **Security pass:** server-side re-pricing, OTP brute-force protection, address only after verification, input validation on every endpoint.
- **Docs:** update `README.md` (new endpoints, env vars, DB, seed/migrate commands); short architecture note on the token + verification seams.
- **Verification step:** run the full flow in Docker (pickup and delivery, registered and new customer), confirm DB rows, confirm OTP appears in logs.

**Deliverables:** test suites green, updated README, manual end-to-end checklist passed.

---

## New / changed API surface (summary)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/menu`, `/api/menu/:id` | Now include option groups |
| POST | `/api/orders/draft` | Mint order token + draft |
| POST | `/api/verify/request` | Send WhatsApp OTP (mock) |
| POST | `/api/verify/confirm` | Confirm OTP → verification grant |
| GET | `/api/customers/lookup?phone=` | Registered? + last address (verified only) |
| POST | `/api/orders/confirm` | Finalize order (token + grant + fulfillment + payment) |
| GET | `/api/orders/:id` | Enriched order for confirmation |

## Data model additions (summary)

- **MenuItem** ← `optionGroups[]` (`min`, `max`, `required`) → **Option** (`priceDeltaCents`).
- **Customer** (`phone` unique) → **Address[]** (`lastUsedAt`).
- **Order** ← `orderToken`, `fulfillmentType`, `paymentMethod`, `addressId?`, `customerId?`; **OrderLine** ← `selectedOptions[]`.
- **VerificationToken** (hashed, TTL, attempts).

## Sequencing & dependencies

- Phase 0 unblocks everything that persists (1, 2, 4, 5, 7).
- Phase 1 → Phase 3 (customization UI needs option data).
- Phase 2 → Phase 6 (checkout submits against the token).
- Phase 5 → Phase 4 lookup gate and Phase 6 verify step.
- Phases 1 and 5 can proceed in parallel after Phase 0.

## Out of scope (this phase)

Real WhatsApp delivery, online card charging, order-status tracking/notifications, admin/kitchen dashboard, auth beyond phone verification, multi-restaurant.
