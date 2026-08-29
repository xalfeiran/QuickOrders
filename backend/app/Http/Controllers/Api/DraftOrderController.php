<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateDraftOrderRequest;
use App\Services\DraftOrderService;

// Order-session endpoints, mounted under /api/orders alongside OrderController.
class DraftOrderController extends Controller
{
    public function __construct(private readonly DraftOrderService $draftOrders) {}

    // POST /api/orders/draft — start an order session for a business,
    // returns the token the client carries through checkout.
    public function store(CreateDraftOrderRequest $request)
    {
        $draft = $this->draftOrders->create($request->validated('businessSlug'));

        return response()->json(['orderToken' => $draft->token, 'expiresAt' => $draft->expires_at]);
    }

    // GET /api/orders/draft/{token} — confirm a session is still alive (used
    // to resume an existing cart). 404 if unknown, 410 if expired.
    public function show(string $token)
    {
        $draft = $this->draftOrders->findActiveByToken($token);

        return response()->json([
            'orderToken' => $draft->token,
            'status' => $draft->status,
            'expiresAt' => $draft->expires_at,
        ]);
    }
}
