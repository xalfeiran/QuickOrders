import { BadRequestException } from '@nestjs/common';
import { MenuItem } from '../menu/menu-item.model';
import { OrderLineOption } from './order-line.entity';

// A chosen option as sent by the client (no price — prices come from the menu).
export interface SelectedOptionInput {
  groupId: string;
  optionId: string;
}

// A fully priced order line (without the order link / id).
export interface PricedLine {
  menuItemId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  selectedOptions: OrderLineOption[];
}

// Validates a line's option selections against the menu item and prices it.
// Pure and side-effect free so it can be unit-tested in isolation. Never trusts
// client-supplied prices — every cent comes from the menu definition.
export function priceLine(
  menuItem: MenuItem,
  selected: SelectedOptionInput[],
  quantity: number,
): PricedLine {
  const options: OrderLineOption[] = [];
  const countByGroup = new Map<string, number>();

  for (const choice of selected) {
    const group = menuItem.optionGroups.find((g) => g.id === choice.groupId);
    if (!group) {
      throw new BadRequestException(
        `Unknown option group "${choice.groupId}" for ${menuItem.name}`,
      );
    }
    const option = group.options.find((o) => o.id === choice.optionId);
    if (!option) {
      throw new BadRequestException(
        `Unknown option "${choice.optionId}" in ${group.name}`,
      );
    }
    countByGroup.set(group.id, (countByGroup.get(group.id) ?? 0) + 1);
    options.push({
      groupId: group.id,
      groupName: group.name,
      optionId: option.id,
      optionName: option.name,
      priceDeltaCents: option.priceDeltaCents,
    });
  }

  // Enforce each group's min/max.
  for (const group of menuItem.optionGroups) {
    const count = countByGroup.get(group.id) ?? 0;
    if (count < group.min || count > group.max) {
      throw new BadRequestException(
        `Choose ${group.min}–${group.max} for ${group.name}`,
      );
    }
  }

  // Reject duplicate picks of the same option.
  const picks = options.map((o) => `${o.groupId}:${o.optionId}`);
  if (new Set(picks).size !== picks.length) {
    throw new BadRequestException('Duplicate option selected');
  }

  const deltaCents = options.reduce((sum, o) => sum + o.priceDeltaCents, 0);
  const unitPriceCents = menuItem.priceCents + deltaCents;

  return {
    menuItemId: menuItem.id,
    name: menuItem.name,
    unitPriceCents,
    quantity,
    lineTotalCents: unitPriceCents * quantity,
    selectedOptions: options,
  };
}
