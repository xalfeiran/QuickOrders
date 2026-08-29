// Format a price given in minor units (cents) as a currency string — ported
// as-is from frontend/src/utils/money.js.
export function formatPrice(cents, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

// Converts a "12.50" pesos string (as typed into a form field) to cents.
export function pesosToCents(str) {
  return Math.round(parseFloat(str || '0') * 100) || 0;
}

// Converts cents back to a "12.50" pesos string for editing.
export function centsToPesos(cents) {
  return (cents / 100).toFixed(2);
}
