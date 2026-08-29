<?php

namespace App\Services;

use App\Models\MenuItem;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

// Serves the public menu catalogue from the database, scoped to a business.
// Rows are mapped to the public shape (id = item_key) so the cart, order
// pricing, and frontend keep working unchanged.
class MenuService
{
    public function findAll(string $businessId): array
    {
        return MenuItem::where('business_id', $businessId)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (MenuItem $m) => $m->toPublicArray())
            ->all();
    }

    public function findOne(string $businessId, string $itemKey): array
    {
        $row = MenuItem::where('business_id', $businessId)->where('item_key', $itemKey)->first();
        if (! $row) {
            throw new NotFoundHttpException("Menu item \"{$itemKey}\" not found");
        }

        return $row->toPublicArray();
    }
}
