<?php

namespace App\Services;

use App\Models\AdminUser;
use App\Models\Order;
use App\Models\OrderLine;
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

    // Full detail shape the dashboards expect (list() above only returns the
    // lighter summary shape used by the list screens).
    public function findOne(AdminUser $user, string $id): array
    {
        return $this->serialize($this->fetchAuthorized($user, $id));
    }

    public function updateStatus(AdminUser $user, string $id, string $status): array
    {
        $order = $this->fetchAuthorized($user, $id);
        $order->status = $status;
        $order->save();

        return $this->serialize($order);
    }

    // Loads an order with its lines and checks the requesting admin can see it.
    private function fetchAuthorized(AdminUser $user, string $id): Order
    {
        $order = Order::with('lines')->find($id);
        if (! $order) {
            throw new NotFoundHttpException('Order not found');
        }
        TenantResolver::assertBusinessAccess($user, $order->business_id);

        return $order;
    }

    // Eloquent models serialize their raw (snake_case) database columns, but
    // the dashboards — both the web admin panel and the owner app — expect
    // the same camelCase shape list() returns above, plus the priced items.
    private function serialize(Order $order): array
    {
        return [
            'id' => $order->id,
            'customerName' => $order->customer_name,
            'customerPhone' => $order->customer_phone,
            'fulfillmentType' => $order->fulfillment_type,
            'paymentMethod' => $order->payment_method,
            'status' => $order->status,
            'totalCents' => $order->total_cents,
            'deliveryAddress' => $order->delivery_address,
            'createdAt' => $order->created_at,
            'items' => $order->lines->map(fn (OrderLine $line) => [
                'id' => $line->id,
                'name' => $line->name,
                'quantity' => $line->quantity,
                'unitPriceCents' => $line->unit_price_cents,
                'lineTotalCents' => $line->line_total_cents,
                'selectedOptions' => $line->selected_options,
            ])->all(),
        ];
    }
}
