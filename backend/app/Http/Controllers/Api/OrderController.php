<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ConfirmOrderRequest;
use App\Services\OrderConfirmationService;

class OrderController extends Controller
{
    public function __construct(private readonly OrderConfirmationService $orders) {}

    // POST /api/orders/confirm — place the order at the end of checkout.
    // Guarded by the 'verify.grant' middleware: the caller must present a
    // verification grant for the phone in the body.
    public function confirm(ConfirmOrderRequest $request)
    {
        $order = $this->orders->confirm($request->validated());

        return response()->json($order);
    }

    // GET /api/orders/{id} — retrieve an order for the confirmation screen.
    public function show(string $id)
    {
        return response()->json($this->orders->findOne($id));
    }
}
