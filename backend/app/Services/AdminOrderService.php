<?php

namespace App\Services;

use App\Models\AdminUser;
use App\Models\Order;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class AdminOrderService
{
    public function __construct(private readonly TenantResolver $tenants) {}

    public function list(AdminUser $user, ?string $slug = null, ?string $status = null): array
    {
        $businessId = $this->tenants->resolveBusinessId($user, $slug);
        if (! $businessId) {
            return [];
        }

        $query = Order::with('lines')->where('business_id', $businessId);
        if ($status) {
            $query->where('status', $status);
        }

        return $query->orderByDesc('created_at')
            ->limit(100)
            ->get()
            ->map(fn (Order $o) => [
                'id' => $o->id,
                'customerName' => $o->customer_name,
                'customerPhone' => $o->customer_phone,
                'fulfillmentType' => $o->fulfillment_type,
                'paymentMethod' => $o->payment_method,
                'status' => $o->status,
                'totalCents' => $o->total_cents,
                'itemCount' => $o->lines->sum('quantity'),
                'createdAt' => $o->created_at,
            ])
            ->all();
    }

    public function findOne(AdminUser $user, string $id): Order
    {
        $order = Order::with(['lines', 'business'])->find($id);
        if (! $order) {
            throw new NotFoundHttpException('Order not found');
        }
        TenantResolver::assertBusinessAccess($user, $order->business_id);

        return $order;
    }

    public function updateStatus(AdminUser $user, string $id, string $status): Order
    {
        $order = $this->findOne($user, $id);
        $order->status = $status;
        $order->save();

        return $order;
    }
}
