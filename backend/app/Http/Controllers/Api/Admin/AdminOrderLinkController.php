<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateOrderLinkRequest;
use App\Services\ManagedSessionService;

class AdminOrderLinkController extends Controller
{
    public function __construct(private readonly ManagedSessionService $sessions) {}

    // POST /api/admin/order-links?businessSlug= { phone }
    public function store(CreateOrderLinkRequest $request)
    {
        return response()->json($this->sessions->create(
            $request->user(),
            $request->query('businessSlug'),
            $request->validated('phone'),
        ));
    }
}
