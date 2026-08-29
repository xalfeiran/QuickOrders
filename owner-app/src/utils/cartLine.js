// Short human-readable summary of the options chosen on an order line, e.g.
// "Grande · Aioli" — ported from frontend/src/cart/line.js (describeOptions
// is the only part the dashboard needs; building/pricing lines happens on
// the customer-facing app, not here).
export function describeOptions(selectedOptions) {
  return selectedOptions.map((option) => option.optionName).join(' · ');
}
