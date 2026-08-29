<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;

// Superadmin-only (enforced by route middleware admin.role:superadmin):
// the list of businesses for the dashboard switcher.
class AdminBusinessController extends Controller
{
    public function index()
    {
        $rows = Business::where('active', true)->orderBy('name')->get();

        return response()->json($rows->map(fn (Business $b) => [
            'id' => $b->id,
            'slug' => $b->slug,
            'name' => $b->name,
        ]));
    }
}
