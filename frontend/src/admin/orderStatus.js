// Shared order-status vocabulary for the dashboard.
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
