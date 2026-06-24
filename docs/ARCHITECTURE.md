# Architecture notes

Design notes for the parts of QuickOrder that aren't obvious from the code:
the order-session token, phone verification, and server-side pricing. The aim
is readability — small pieces with clear seams you can swap later.

## Order-session token (draft orders)

When the cart receives its first item the frontend calls `POST /orders/draft`,
which mints an opaque `orderToken` (UUID) backed by a `draft_orders` row. The
token rides along in the React cart state and is submitted at checkout.

- The token is **separate from the primary key** so the internal id is never
  exposed.
- Drafts have a TTL (`expires_at`, 2h). `findActiveByToken` returns `404` if the
  token is unknown and `410 Gone` if it has expired, so the client knows to
  start a fresh session.
- Abandoned drafts are purged opportunistically when a new draft is created — no
  separate scheduler needed at this scale (swap for a cron if volume grows).
- On a successful order the draft is **consumed** (deleted), so the same session
  can't be ordered twice.

Cart contents live client-side and are attached only at confirmation
("sync-at-checkout"), so there's no per-keystroke traffic.

## Phone verification

Two collaborating pieces, both in `src/verification`:

**OTP (`verification_tokens` + `VerificationOtpService`)**
- `POST /verify/request` generates a 6-digit code, stores only a **keyed hash**
  of it (HMAC-SHA256 bound to the phone), and "sends" it via the notifier.
- A 30s **resend cooldown** and a **5-attempt lock** guard against abuse; codes
  are single-use and expire after 5 minutes.

**Grant (`VerificationGrantService`)**
- On a correct code, the service issues a short-lived (15 min), **HMAC-signed,
  phone-bound, stateless** grant — proof the number was verified.
- `VerificationGuard` requires a matching grant (header `x-verification-grant`)
  on the endpoints that expose or act on customer data: the address lookup and
  order confirmation. A grant can't be forged without `VERIFICATION_SECRET` and
  can't be reused for a different number.

**WhatsApp seam**
- `WhatsAppNotifier` is an abstract class; `MockWhatsAppNotifier` just logs the
  code. Bind a real provider (WhatsApp Cloud API / Twilio) by changing the one
  `useClass` line in `VerificationModule` — nothing else changes.

## Server-side pricing

`order-pricing.ts#priceLine` is pure and is the **only** place a line price is
computed. It re-derives every cent from the menu definition and validates the
chosen options against their groups (membership + min/max + no duplicates).
Client-supplied prices are never trusted; the confirm endpoint ignores them.

## Security posture

Covered today:

- **Server-side re-pricing** — clients can't dictate prices.
- **OTP brute-force protection** — hashed codes, attempt lockout, resend
  cooldown, single-use, short TTL.
- **Address protection** — customer data is returned only behind a valid,
  phone-bound verification grant.
- **Input validation** — global `ValidationPipe` (`whitelist` +
  `forbidNonWhitelisted`) plus per-endpoint DTOs.
- **No client price trust**, secrets via env, CORS restricted to the frontend
  origin.

Recommended next steps (not yet implemented):

- Set a strong `VERIFICATION_SECRET` in production (the default is insecure).
- Add IP-level rate limiting (e.g. `@nestjs/throttler`) on `/verify/request`
  on top of the per-phone cooldown.
- Make `POST /orders/confirm` idempotent (a unique constraint on `order_token`)
  to fully rule out double-submits under races.
- De-duplicate stored addresses (currently kept as history; lookup returns the
  most recently used).
