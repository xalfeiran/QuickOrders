// Shared order-status vocabulary for the dashboard — ported as-is from
// frontend/src/admin/orderStatus.js so both apps agree on labels.
export const ORDER_STATUSES = ['received', 'preparing', 'ready', 'completed'];

export const STATUS_LABELS = {
  received: 'Recibido',
  preparing: 'En preparación',
  ready: 'Listo',
  completed: 'Entregado',
};

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

// A colour per status, used for the small badge on the orders list.
export const STATUS_COLORS = {
  received: '#2563eb',
  preparing: '#d97706',
  ready: '#16a34a',
  completed: '#6b7280',
};
