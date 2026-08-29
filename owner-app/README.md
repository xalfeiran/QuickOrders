# QuickOrder Owner — mobile dashboard (Expo Go)

A React Native app for restaurant owners/managers to run the QuickOrder
dashboard from their phone: see and update orders, edit the menu (including
option groups and recipes), manage ingredient stock, and generate pre-verified
order links for customers.

It talks to the same NestJS API as `../backend` and mirrors the feature set of
`../frontend/src/admin` (the web dashboard) — same endpoints, same roles
(`superadmin` / `business_admin`), same Spanish labels.

## Requirements

- Node.js 18+ and npm
- Built on **Expo SDK 54** (`react-native` 0.81, `react` 19.1) — install the
  matching build of [Expo Go](https://expo.dev/go) on your phone (iOS or
  Android). Expo Go only runs one SDK at a time, so if your phone already has
  Expo Go installed for a different project on a different SDK, update the
  app from your phone's app store; `npx expo start` will also warn you if
  there's a mismatch.
- Your phone and computer on the **same Wi‑Fi network**
- The QuickOrder backend running and reachable on your network (see
  `../README.md` / `../docker-compose.yml`)

## Running it

```bash
cd owner-app
npm install
npx expo start
```

Scan the QR code with Expo Go (Android: the Expo Go app's scanner; iOS: the
Camera app). The app will build and load on your phone.

## Pointing the app at your backend

Your phone is a separate device from the computer running the backend, so it
**cannot use `localhost`** — that would mean the phone itself. On first
launch, the app opens straight to a "Configurar dirección del servidor"
screen (also reachable from Ajustes → after login) where you enter:

- **URL de la API** — your computer's LAN IP + the backend port + `/api`,
  e.g. `http://192.168.1.42:3000/api`. Find your computer's IP with
  `ipconfig getifaddr en0` (macOS Wi-Fi), `hostname -I` (Linux), or
  `ipconfig` (Windows, look for "IPv4 Address").
- **URL de la tienda** — same idea, pointing at the customer-facing frontend
  (`http://192.168.1.42:8080` by default), used only to build the full,
  shareable link on the Enlaces screen (the API only returns a relative
  path).

These are saved on the device (AsyncStorage) so you only set them once. If
you switch networks (e.g. move from home to the restaurant's Wi‑Fi), just
open Ajustes and update the IP.

Because the backend's CORS settings only affect browser requests, you do
**not** need to add anything to `CORS_ORIGIN` for this app — native apps
aren't subject to the browser's same-origin policy.

## How login works

The dashboard API uses **httpOnly session cookies** (see
`backend/src/main.ts`), the same as the web dashboard — there's no separate
mobile token endpoint. React Native's networking layer stores and resends
cookies for a host automatically, so once you log in with
`api.adminLogin(email, password)` the session cookie is kept and sent on
every subsequent request, the same way a browser would. Logging out clears it
server-side.

One practical note: cookie persistence across a **full app restart** can
occasionally behave differently between Android and iOS builds of Expo Go
depending on OS version. If you ever find yourself logged out unexpectedly,
just log back in — it's a one-time inconvenience, not a broken account.

## What's inside

```
App.js                     App shell: providers + navigator
src/api/client.js          One function per backend endpoint (fetch wrapper)
src/api/config.js          Stores/reads the API + storefront URLs
src/context/AuthContext.js Logged-in user, login(), logout()
src/hooks/useBusinessScope.js   Superadmin business switcher / pinned business
src/constants/             Order status labels+colors, shared theme values
src/components/            Small reusable UI pieces (Button, FormField, ...)
src/navigation/            Bottom tabs + per-tab stacks
src/screens/
  LoginScreen.js
  orders/OrdersListScreen.js, OrderDetailScreen.js
  menu/MenuListScreen.js, MenuItemFormScreen.js, RecipeScreen.js
  inventory/InventoryScreen.js
  links/OrderLinksScreen.js
  settings/SettingsScreen.js
```

Each screen has a comment pointing at the web dashboard page it mirrors
(`frontend/src/admin/...`), so if a business rule changes there (e.g. a new
order status), the equivalent change here is easy to find.

## Features

- **Pedidos (Orders)** — list with business/status filters, pull to refresh,
  tap for full detail (items, options, delivery address, payment method),
  change status inline or from the detail screen.
- **Menú (Menu)** — list with availability toggle; create/edit a dish
  including price, category, sort order, and option groups (size, add-ons,
  etc. with per-option price deltas); delete with confirmation.
- **Inventario (Inventory)** — add ingredients (name, unit, starting stock),
  edit stock/unit/active state inline, delete.
- **Receta (Recipe)**, opened from a menu item — which ingredients (and how
  much of each) the base dish and each option consume; this is what makes
  stock get decremented automatically when an order is confirmed.
- **Enlaces (Order links)** — generate a single-use, 24‑hour order link for a
  customer's phone number (skips SMS verification), with copy-to-clipboard
  and a native share sheet (e.g. straight to WhatsApp).
- **Ajustes (Settings)** — API/storefront URL configuration, account info,
  logout.

## Notes on scope

- Business creation isn't exposed here because the backend doesn't expose it
  either (`GET /api/admin/businesses` is list-only) — a superadmin adds new
  businesses via the seed/database, same as with the web dashboard.
- No push notifications yet. Pull-to-refresh on Orders and automatic reload
  on tab focus keep the list reasonably current without them.
