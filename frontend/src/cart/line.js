// Helpers for turning a menu item + chosen options into a cart line.
//
// A "line" represents one customised variant of an item. Two scoops of the
// same item with different options are different lines; the same item with the
// same options collapses into one line (quantity goes up).

// A selected option carries enough detail to display and re-price the line
// without re-fetching the menu.
//   { groupId, groupName, optionId, optionName, priceDeltaCents }

// Deterministic key so identical selections map to the same line regardless of
// the order options were picked in.
export function lineKey(menuItemId, selectedOptions) {
  const parts = selectedOptions
    .map((o) => `${o.groupId}:${o.optionId}`)
    .sort();
  return [menuItemId, ...parts].join('|');
}

// Builds a cart line with its key and per-unit price (base + option deltas).
export function buildCartLine(item, selectedOptions, quantity) {
  const deltaCents = selectedOptions.reduce(
    (sum, o) => sum + o.priceDeltaCents,
    0,
  );
  return {
    key: lineKey(item.id, selectedOptions),
    menuItemId: item.id,
    name: item.name,
    basePriceCents: item.priceCents,
    selectedOptions,
    unitPriceCents: item.priceCents + deltaCents,
    quantity,
  };
}

// Short human-readable summary of the chosen options, e.g. "Large · Aioli".
export function describeOptions(selectedOptions) {
  return selectedOptions.map((o) => o.optionName).join(' · ');
}
