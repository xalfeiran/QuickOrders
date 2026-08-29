<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AvailabilityRequest;
use App\Http\Requests\Admin\MenuItemRequest;
use App\Services\AdminMenuService;
use Illuminate\Http\Request;

class AdminMenuController extends Controller
{
    public function __construct(private readonly AdminMenuService $menu) {}

    public function index(Request $request)
    {
        return response()->json($this->menu->list($request->user(), $request->query('businessSlug')));
    }

    public function show(Request $request, string $id)
    {
        return response()->json($this->menu->findOne($request->user(), $id));
    }

    public function store(MenuItemRequest $request)
    {
        return response()->json(
            $this->menu->create($request->user(), $request->query('businessSlug'), $request->validated())
        );
    }

    public function update(MenuItemRequest $request, string $id)
    {
        return response()->json($this->menu->update($request->user(), $id, $request->validated()));
    }

    public function setAvailability(AvailabilityRequest $request, string $id)
    {
        return response()->json(
            $this->menu->setAvailability($request->user(), $id, $request->validated('available'))
        );
    }

    public function destroy(Request $request, string $id)
    {
        return response()->json($this->menu->remove($request->user(), $id));
    }
}
