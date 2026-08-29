<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IngredientRequest;
use App\Services\InventoryService;
use Illuminate\Http\Request;

class AdminInventoryController extends Controller
{
    public function __construct(private readonly InventoryService $inventory) {}

    public function index(Request $request)
    {
        return response()->json(
            $this->inventory->listIngredients($request->user(), $request->query('businessSlug'))
        );
    }

    public function store(IngredientRequest $request)
    {
        return response()->json(
            $this->inventory->createIngredient($request->user(), $request->query('businessSlug'), $request->validated())
        );
    }

    public function update(IngredientRequest $request, string $id)
    {
        return response()->json($this->inventory->updateIngredient($request->user(), $id, $request->validated()));
    }

    public function destroy(Request $request, string $id)
    {
        return response()->json($this->inventory->removeIngredient($request->user(), $id));
    }
}
