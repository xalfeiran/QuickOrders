<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RecipeRequest;
use App\Services\InventoryService;
use Illuminate\Http\Request;

// Recipe editing for a menu item. Mounted under /api/admin/menu alongside
// AdminMenuController (different sub-paths, no collision).
class AdminRecipeController extends Controller
{
    public function __construct(private readonly InventoryService $inventory) {}

    public function show(Request $request, string $id)
    {
        return response()->json($this->inventory->getRecipe($request->user(), $id));
    }

    public function update(RecipeRequest $request, string $id)
    {
        return response()->json($this->inventory->saveRecipe($request->user(), $id, $request->validated()));
    }
}
