<?php

namespace App\Services;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

// Validates a line's option selections against the menu item and prices it.
// Pure and side-effect free so it can be unit-tested in isolation. Never
// trusts client-supplied prices — every cent comes from the menu definition.
//
// $menuItem is the public menu-item array shape (see MenuItem::toPublicArray()):
//   ['id' => ..., 'name' => ..., 'priceCents' => ..., 'optionGroups' => [...]]
// $selected is a list of ['groupId' => ..., 'optionId' => ...].
class OrderPricer
{
    public static function priceLine(array $menuItem, array $selected, int $quantity): array
    {
        $options = [];
        $countByGroup = [];

        foreach ($selected as $choice) {
            $group = self::findGroup($menuItem['optionGroups'], $choice['groupId']);
            if (! $group) {
                throw new BadRequestHttpException(
                    "Unknown option group \"{$choice['groupId']}\" for {$menuItem['name']}"
                );
            }
            $option = self::findOption($group['options'], $choice['optionId']);
            if (! $option) {
                throw new BadRequestHttpException(
                    "Unknown option \"{$choice['optionId']}\" in {$group['name']}"
                );
            }
            $countByGroup[$group['id']] = ($countByGroup[$group['id']] ?? 0) + 1;
            $options[] = [
                'groupId' => $group['id'],
                'groupName' => $group['name'],
                'optionId' => $option['id'],
                'optionName' => $option['name'],
                'priceDeltaCents' => $option['priceDeltaCents'],
            ];
        }

        // Enforce each group's min/max.
        foreach ($menuItem['optionGroups'] as $group) {
            $count = $countByGroup[$group['id']] ?? 0;
            if ($count < $group['min'] || $count > $group['max']) {
                throw new BadRequestHttpException(
                    "Choose {$group['min']}–{$group['max']} for {$group['name']}"
                );
            }
        }

        // Reject duplicate picks of the same option.
        $picks = array_map(fn ($o) => "{$o['groupId']}:{$o['optionId']}", $options);
        if (count(array_unique($picks)) !== count($picks)) {
            throw new BadRequestHttpException('Duplicate option selected');
        }

        $deltaCents = array_sum(array_column($options, 'priceDeltaCents'));
        $unitPriceCents = $menuItem['priceCents'] + $deltaCents;

        return [
            'menuItemId' => $menuItem['id'],
            'name' => $menuItem['name'],
            'unitPriceCents' => $unitPriceCents,
            'quantity' => $quantity,
            'lineTotalCents' => $unitPriceCents * $quantity,
            'selectedOptions' => $options,
        ];
    }

    private static function findGroup(array $groups, string $id): ?array
    {
        foreach ($groups as $group) {
            if ($group['id'] === $id) {
                return $group;
            }
        }

        return null;
    }

    private static function findOption(array $options, string $id): ?array
    {
        foreach ($options as $option) {
            if ($option['id'] === $id) {
                return $option;
            }
        }

        return null;
    }
}
