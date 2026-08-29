// Thin wrapper around fetch for talking to the QuickOrder API — the mobile
// counterpart of frontend/src/api/client.js. Same endpoints, same shapes;
// only the base URL and error handling are adapted for React Native.
import { getApiBaseUrl } from './config';

// Turns a NestJS error response into a readable message. class-validator
// failures come back as { message: string[] }; everything else is usually
// { message: string }. Falling back to the raw body keeps unexpected shapes
// from disappearing silently.
function extractErrorMessage(bodyText, status) {
  try {
    const parsed = JSON.parse(bodyText);
    if (Array.isArray(parsed?.message)) return parsed.message.join('\n');
    if (typeof parsed?.message === 'string') return parsed.message;
  } catch {
    // Not JSON — fall through to the raw text.
  }
  return bodyText || `Solicitud fallida (${status})`;
}

async function request(path, options = {}) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    // The admin endpoints rely on a session cookie set by /auth/login.
    // React Native's networking layer stores and resends cookies for a host
    // automatically, the same way a browser would.
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(extractErrorMessage(bodyText, response.status));
  }
  return bodyText ? JSON.parse(bodyText) : null;
}

function qs(params) {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) usp.set(key, value);
  }
  const str = usp.toString();
  return str ? `?${str}` : '';
}

export const api = {
  // --- Admin auth (session-cookie based) ---
  adminLogin: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  adminLogout: () => request('/auth/logout', { method: 'POST' }),
  adminMe: () => request('/auth/me'),

  // Superadmin: list of businesses for the switcher.
  adminBusinesses: () => request('/admin/businesses'),

  // Orders.
  adminOrders: (businessSlug, status) =>
    request(`/admin/orders${qs({ businessSlug, status })}`),
  adminOrder: (id) => request(`/admin/orders/${id}`),
  adminUpdateOrderStatus: (id, status) =>
    request(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Menu management.
  adminMenu: (businessSlug) => request(`/admin/menu${qs({ businessSlug })}`),
  adminMenuItem: (id) => request(`/admin/menu/${id}`),
  adminMenuCreate: (businessSlug, item) =>
    request(`/admin/menu${qs({ businessSlug })}`, {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  adminMenuUpdate: (id, item) =>
    request(`/admin/menu/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  adminMenuSetAvailability: (id, available) =>
    request(`/admin/menu/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ available }),
    }),
  adminMenuDelete: (id) => request(`/admin/menu/${id}`, { method: 'DELETE' }),

  // Inventory.
  adminInventory: (businessSlug) =>
    request(`/admin/inventory${qs({ businessSlug })}`),
  adminInventoryCreate: (businessSlug, ingredient) =>
    request(`/admin/inventory${qs({ businessSlug })}`, {
      method: 'POST',
      body: JSON.stringify(ingredient),
    }),
  adminInventoryUpdate: (id, ingredient) =>
    request(`/admin/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ingredient),
    }),
  adminInventoryDelete: (id) =>
    request(`/admin/inventory/${id}`, { method: 'DELETE' }),

  // Recipe for a menu item (which ingredients it consumes).
  adminRecipe: (itemId) => request(`/admin/menu/${itemId}/recipe`),
  adminRecipeSave: (itemId, recipe) =>
    request(`/admin/menu/${itemId}/recipe`, {
      method: 'PUT',
      body: JSON.stringify(recipe),
    }),

  // Manager: create a pre-verified order link for a customer's phone.
  adminCreateOrderLink: (businessSlug, phone) =>
    request(`/admin/order-links${qs({ businessSlug })}`, {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),
};
