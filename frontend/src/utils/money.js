// Format a price given in minor units (cents) as a currency string.
export function formatPrice(cents, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}
