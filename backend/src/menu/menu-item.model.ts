// A single selectable option within a group, e.g. "Large" or "Extra cheese".
export interface MenuOption {
  id: string;
  name: string;
  // Amount added to (or subtracted from) the item's base price when chosen.
  // 0 for options that don't change the price.
  priceDeltaCents: number;
}

// A set of related choices attached to a menu item, e.g. "Size" or "Add-ons".
// min/max bound how many options the customer may pick:
//   - single-choice (radio):   min 1, max 1, required true
//   - optional multi (checkbox): min 0, max N, required false
export interface MenuOptionGroup {
  id: string;
  name: string;
  required: boolean;
  min: number;
  max: number;
  options: MenuOption[];
}

// Shape of a single menu item returned by the API.
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  // Price in minor units (cents) to avoid floating-point rounding issues.
  priceCents: number;
  category: string;
  available: boolean;
  // Customizations offered for this item. Empty when nothing to customize.
  optionGroups: MenuOptionGroup[];
}
