// Thin wrapper around fetch for talking to the QuickOrder API.
// The base URL is injected at build time via Vite env vars.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    // Send the session cookie (needed for the admin dashboard endpoints).
    credentials: 'include',
    // Merge headers so callers can add their own (e.g. the verification grant).
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }
  return response.json();
}

export const api = {
  // Public business info for the header.
  getBusiness: (slug) => request(`/b/${encodeURIComponent(slug)}`),
  // Menu for a specific business.
  getMenu: (slug) => request(`/b/${encodeURIComponent(slug)}/menu`),
  getOrder: (orderId) => request(`/orders/${orderId}`),
  // Starts an order session for a business; returns { orderToken, expiresAt }.
  createDraft: (slug) =>
    request('/orders/draft', {
      method: 'POST',
      body: JSON.stringify({ businessSlug: slug }),
    }),
  placeOrder: (order) =>
    request('/orders', { method: 'POST', body: JSON.stringify(order) }),

  // Phone verification (WhatsApp OTP).
  requestVerification: (phone) =>
    request('/verify/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),
  confirmVerification: (phone, code) =>
    request('/verify/confirm', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),

  // Exchanges a manager-link token for a verification grant (no SMS).
  resolveSession: (token) => request(`/sessions/${token}`),

  // Looks up a returning customer. Requires the grant from confirmVerification.
  lookupCustomer: (phone, grant) =>
    request(`/customers/lookup?phone=${encodeURIComponent(phone)}`, {
      headers: { 'x-verification-grant': grant },
    }),

  // Places the order. Requires the verification grant for the phone.
  confirmOrder: (order, grant) =>
    request('/orders/confirm', {
      method: 'POST',
      headers: { 'x-verification-grant': grant },
      body: JSON.stringify(order),
    }),

  // --- Admin dashboard (session-cookie auth) ---
  adminLogin: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  adminLogout: () => request('/auth/logout', { method: 'POST' }),
  adminMe: () => request('/auth/me'),

  // Superadmin: list of businesses for the switcher.
  adminBusinesses: () => request('/admin/businesses'),
  // Orders for a business, optionally filtered by status.
  adminOrders: (businessSlug, status) => {
    const params = new URLSearchParams();
    if (businessSlug) params.set('businessSlug', businessSlug);
    if (status) params.set('status', status);
    const qs = params.toString();
    return request(`/admin/orders${qs ? `?${qs}` : ''}`);
  },
  adminOrder: (id) => request(`/admin/orders/${id}`),
  adminUpdateOrderStatus: (id, status) =>
    request(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Menu management.
  adminMenu: (businessSlug) =>
    request(
      `/admin/menu${businessSlug ? `?businessSlug=${encodeURIComponent(businessSlug)}` : ''}`,
    ),
  adminMenuItem: (id) => request(`/admin/menu/${id}`),
  adminMenuCreate: (businessSlug, item) =>
    request(
      `/admin/menu${businessSlug ? `?businessSlug=${encodeURIComponent(businessSlug)}` : ''}`,
      { method: 'POST', body: JSON.stringify(item) },
    ),
  adminMenuUpdate: (id, item) =>
    request(`/admin/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    }),
  adminMenuSetAvailability: (id, available) =>
    request(`/admin/menu/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ available }),
    }),
  adminMenuDelete: (id) =>
    request(`/admin/menu/${id}`, { method: 'DELETE' }),

  // Inventory.
  adminInventory: (businessSlug) =>
    request(
      `/admin/inventory${businessSlug ? `?businessSlug=${encodeURIComponent(businessSlug)}` : ''}`,
    ),
  adminInventoryCreate: (businessSlug, ingredient) =>
    request(
      `/admin/inventory${businessSlug ? `?businessSlug=${encodeURIComponent(businessSlug)}` : ''}`,
      { method: 'POST', body: JSON.stringify(ingredient) },
    ),
  adminInventoryUpdate: (id, ingredient) =>
    request(`/admin/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ingredient),
    }),
  adminInventoryDelete: (id) =>
    request(`/admin/inventory/${id}`, { method: 'DELETE' }),

  // Recipe for a menu item.
  adminRecipe: (itemId) => request(`/admin/menu/${itemId}/recipe`),
  adminRecipeSave: (itemId, recipe) =>
    request(`/admin/menu/${itemId}/recipe`, {
      method: 'PUT',
      body: JSON.stringify(recipe),
    }),

  // Manager: create a pre-verified order link for a phone.
  adminCreateOrderLink: (businessSlug, phone) =>
    request(
      `/admin/order-links${businessSlug ? `?businessSlug=${encodeURIComponent(businessSlug)}` : ''}`,
      { method: 'POST', body: JSON.stringify({ phone }) },
    ),
};
