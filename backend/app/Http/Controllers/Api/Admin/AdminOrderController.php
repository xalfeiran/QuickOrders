<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Services\AdminOrderService;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    public function __construct(private readonly AdminOrderService $orders) {}

    // GET /api/admin/orders?businessSlug=&status=
    public function index(Request $request)
    {
        return response()->json($this->orders->list(
            $request->user(),
            $request->query('businessSlug'),
            $request->query('status'),
        ));
    }

    // GET /api/admin/orders/{id}
    public function show(Request $request, string $id)
    {
        return response()->json($this->orders->findOne($request->user(), $id));
    }

    // PATCH /api/admin/orders/{id}/status
    public function updateStatus(UpdateOrderStatusRequest $request, string $id)
    {
        return response()->json(
            $this->orders->updateStatus($request->user(), $id, $request->validated('status'))
        );
    }
}
