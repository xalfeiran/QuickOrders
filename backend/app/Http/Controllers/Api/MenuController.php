<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BusinessService;
use App\Services\MenuService;

// Public menu endpoints. Two shapes:
//   /api/menu[...]          -> the default business (legacy, single-tenant app)
//   /api/b/{slug}/menu[...] -> a specific business by slug
class MenuController extends Controller
{
    public function __construct(
        private readonly MenuService $menu,
        private readonly BusinessService $businesses,
    ) {}

    public function indexDefault()
    {
        $business = $this->businesses->getDefault();

        return response()->json($this->menu->findAll($business->id));
    }

    public function showDefault(string $id)
    {
        $business = $this->businesses->getDefault();

        return response()->json($this->menu->findOne($business->id, $id));
    }

    public function indexForBusiness(string $slug)
    {
        $business = $this->businesses->findBySlug($slug);

        return response()->json($this->menu->findAll($business->id));
    }

    public function showForBusiness(string $slug, string $id)
    {
        $business = $this->businesses->findBySlug($slug);

        return response()->json($this->menu->findOne($business->id, $id));
    }
}
