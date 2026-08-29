<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BusinessService;

class BusinessController extends Controller
{
    public function __construct(private readonly BusinessService $businesses) {}

    // GET /api/b/{slug} — public business info used by the customer app to
    // render its header and confirm the business exists.
    public function show(string $slug)
    {
        $business = $this->businesses->findBySlug($slug);

        return response()->json([
            'slug' => $business->slug,
            'name' => $business->name,
            'phone' => $business->phone,
        ]);
    }
}
