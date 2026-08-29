<?php

namespace App\Services;

use App\Models\AdminUser;
use App\Models\Ingredient;
use App\Models\MenuItem;
use App\Models\RecipeComponent;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class InventoryService
{
    public function __construct(private readonly TenantResolver $tenants) {}

    // ----- Ingredients CRUD (tenant-scoped) -----

    public function listIngredients(AdminUser $user, ?string $slug = null): array
    {
        $businessId = $this->tenants->resolveBusinessId($user, $slug);
        if (! $businessId) {
            return [];
        }

        return Ingredient::where('business_id', $businessId)
            ->orderBy('name')
            ->get()
            ->map(fn (Ingredient $i) => self::ingredientDto($i))
            ->all();
    }

    public function createIngredient(AdminUser $user, ?string $slug, array $dto): array
    {
        $businessId = $this->tenants->resolveBusinessId($user, $slug);
        if (! $businessId) {
            throw new BadRequestHttpException('Selecciona un negocio');
        }

        $ingredient = Ingredient::create([
            'business_id' => $businessId,
            'name' => trim($dto['name']),
            'unit' => $dto['unit'],
            'stock_qty' => $dto['stockQty'],
            'active' => $dto['active'] ?? true,
        ]);

        return self::ingredientDto($ingredient);
    }

    public function updateIngredient(AdminUser $user, string $id, array $dto): array
    {
        $ingredient = $this->loadIngredient($user, $id);
        $ingredient->name = trim($dto['name']);
        $ingredient->unit = $dto['unit'];
        $ingredient->stock_qty = $dto['stockQty'];
        if (array_key_exists('active', $dto) && $dto['active'] !== null) {
            $ingredient->active = $dto['active'];
        }
        $ingredient->save();

        return self::ingredientDto($ingredient);
    }

    public function removeIngredient(AdminUser $user, string $id): array
    {
        $ingredient = $this->loadIngredient($user, $id);
        $ingredient->delete();

        return ['ok' => true];
    }

    private function loadIngredient(AdminUser $user, string $id): Ingredient
    {
        $ingredient = Ingredient::with('business')->find($id);
        if (! $ingredient) {
            throw new NotFoundHttpException('Ingrediente no encontrado');
        }
        TenantResolver::assertBusinessAccess($user, $ingredient->business_id);

        return $ingredient;
    }

    // ----- Recipe per menu item -----

    public function getRecipe(AdminUser $user, string $menuItemId): array
    {
        $item = $this->loadMenuItem($user, $menuItemId);
        $components = RecipeComponent::with('ingredient')
            ->where('menu_item_id', $item->id)
            ->get();

        $base = $components->filter(fn ($c) => $c->scope === 'base')
            ->map(fn ($c) => self::componentDto($c))->values()->all();

        $options = [];
        foreach ($components as $c) {
            if ($c->scope !== 'option' || ! $c->option_group_id || ! $c->option_id) {
                continue;
            }
            $key = "{$c->option_group_id}:{$c->option_id}";
            $options[$key] ??= [];
            $options[$key][] = self::componentDto($c);
        }

        return ['base' => $base, 'options' => $options];
    }

    public function saveRecipe(AdminUser $user, string $menuItemId, array $dto): array
    {
        $item = $this->loadMenuItem($user, $menuItemId);
        $businessId = $item->business_id;

        // Only ingredients belonging to this business may be referenced.
        $ownedIds = Ingredient::where('business_id', $businessId)->pluck('id')->all();
        $ownedIds = array_flip($ownedIds);

        $rows = [];
        $pushRow = function (string $scope, mixed $ingredientId, mixed $quantity, ?string $groupId = null, ?string $optionId = null) use (&$rows, $ownedIds, $businessId, $item) {
            $qty = (float) $quantity;
            if (! $ingredientId || ! isset($ownedIds[(string) $ingredientId]) || ! ($qty > 0)) {
                return; // skip empty/invalid rows silently
            }
            $rows[] = [
                'business_id' => $businessId,
                'menu_item_id' => $item->id,
                'scope' => $scope,
                'option_group_id' => $scope === 'option' ? $groupId : null,
                'option_id' => $scope === 'option' ? $optionId : null,
                'ingredient_id' => (string) $ingredientId,
                'quantity' => $qty,
            ];
        };

        foreach (($dto['base'] ?? []) as $raw) {
            $raw = (array) $raw;
            $pushRow('base', $raw['ingredientId'] ?? null, $raw['quantity'] ?? null);
        }
        foreach (($dto['options'] ?? []) as $raw) {
            $raw = (array) $raw;
            $groupId = is_string($raw['groupId'] ?? null) ? $raw['groupId'] : null;
            $optionId = is_string($raw['optionId'] ?? null) ? $raw['optionId'] : null;
            $comps = is_array($raw['components'] ?? null) ? $raw['components'] : [];
            if (! $groupId || ! $optionId) {
                continue;
            }
            foreach ($comps as $c) {
                $c = (array) $c;
                $pushRow('option', $c['ingredientId'] ?? null, $c['quantity'] ?? null, $groupId, $optionId);
            }
        }

        // Replace the item's recipe atomically.
        DB::transaction(function () use ($item, $rows) {
            RecipeComponent::where('menu_item_id', $item->id)->delete();
            foreach ($rows as $row) {
                RecipeComponent::create($row);
            }
        });

        return $this->getRecipe($user, $menuItemId);
    }

    private function loadMenuItem(AdminUser $user, string $id): MenuItem
    {
        $item = MenuItem::with('business')->find($id);
        if (! $item) {
            throw new NotFoundHttpException('Platillo no encontrado');
        }
        TenantResolver::assertBusinessAccess($user, $item->business_id);

        return $item;
    }

    // ----- Stock consumption at order confirmation (runs in a transaction) -----

    // Computes how much of each ingredient the order needs (base + selected
    // options, x line quantity), rejects if any ingredient is short,
    // otherwise decrements stock. Items without recipes consume nothing.
    // $lines is a list of ['menuItemId' => itemKey, 'quantity' => n,
    // 'selectedOptions' => [['groupId'=>..,'optionId'=>..], ...]].
    // Must be called inside an existing DB transaction (see
    // OrderConfirmationService::confirm()).
    public function consumeForOrder(string $businessId, array $lines): void
    {
        $itemKeys = array_values(array_unique(array_column($lines, 'menuItemId')));
        if (count($itemKeys) === 0) {
            return;
        }

        $items = MenuItem::where('business_id', $businessId)
            ->whereIn('item_key', $itemKeys)
            ->lockForUpdate()
            ->get();
        $keyToId = $items->pluck('id', 'item_key');
        $itemIds = $items->pluck('id')->all();
        if (count($itemIds) === 0) {
            return;
        }

        $components = RecipeComponent::with(['ingredient', 'menuItem'])
            ->whereIn('menu_item_id', $itemIds)
            ->get();
        if ($components->isEmpty()) {
            return; // no recipes -> nothing to consume
        }

        $byItem = [];
        foreach ($components as $c) {
            $byItem[$c->menu_item_id] ??= [];
            $byItem[$c->menu_item_id][] = $c;
        }

        $required = []; // ingredientId => quantity
        foreach ($lines as $line) {
            $itemId = $keyToId[$line['menuItemId']] ?? null;
            if (! $itemId) {
                continue;
            }
            $comps = $byItem[$itemId] ?? [];
            $selected = array_map(
                fn ($o) => "{$o['groupId']}:{$o['optionId']}",
                $line['selectedOptions'] ?? []
            );
            foreach ($comps as $c) {
                $applies = $c->scope === 'base'
                    || ($c->scope === 'option'
                        && $c->option_group_id && $c->option_id
                        && in_array("{$c->option_group_id}:{$c->option_id}", $selected, true));
                if (! $applies) {
                    continue;
                }
                $add = (float) $c->quantity * $line['quantity'];
                $required[$c->ingredient_id] = ($required[$c->ingredient_id] ?? 0) + $add;
            }
        }
        if (count($required) === 0) {
            return;
        }

        $ingredients = Ingredient::whereIn('id', array_keys($required))
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        $shortages = [];
        foreach ($required as $ingredientId => $need) {
            $ing = $ingredients->get($ingredientId);
            if (! $ing) {
                continue;
            }
            if ($ing->stock_qty < $need) {
                $missing = number_format($need - $ing->stock_qty, 3, '.', '');
                $shortages[] = "{$ing->name} (faltan {$missing} {$ing->unit})";
            }
        }
        if (count($shortages) > 0) {
            throw new BadRequestHttpException('Inventario insuficiente: '.implode(', ', $shortages));
        }

        foreach ($required as $ingredientId => $need) {
            $ing = $ingredients->get($ingredientId);
            if (! $ing) {
                continue;
            }
            $ing->stock_qty -= $need;
            $ing->save();
        }
    }

    private static function ingredientDto(Ingredient $i): array
    {
        return [
            'id' => $i->id,
            'name' => $i->name,
            'unit' => $i->unit,
            'stockQty' => (float) $i->stock_qty,
            'active' => $i->active,
        ];
    }

    private static function componentDto(RecipeComponent $c): array
    {
        return [
            'ingredientId' => $c->ingredient->id,
            'ingredientName' => $c->ingredient->name,
            'unit' => $c->ingredient->unit,
            'quantity' => (float) $c->quantity,
        ];
    }
}
