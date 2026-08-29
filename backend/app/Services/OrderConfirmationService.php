<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderLine;
use App\Support\PhoneNormalizer;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

// Finalises an order from a verified checkout. The verification grant is
// enforced by the route's middleware (verify.grant) before this runs.
class OrderConfirmationService
{
    public function __construct(
        private readonly DraftOrderService $draftOrders,
        private readonly MenuService $menu,
        private readonly CustomerService $customers,
        private readonly InventoryService $inventory,
        private readonly ManagedSessionService $managedSessions,
    ) {}

    public function confirm(array $dto): Order
    {
        // Tie the order to a live session; throws 404/410 if the token is
        // gone. The draft carries the business the order belongs to.
        $draft = $this->draftOrders->findActiveByToken($dto['orderToken']);
        $business = $draft->business;

        if ($dto['fulfillmentType'] === 'delivery' && empty($dto['address'])) {
            throw new BadRequestHttpException('A delivery address is required');
        }

        // Price every line on the server against this business's real menu.
        $lines = [];
        foreach ($dto['items'] as $item) {
            // 404 if unknown for this business.
            $menuItem = $this->menu->findOne($business->id, $item['menuItemId']);
            $lines[] = OrderPricer::priceLine($menuItem, $item['selectedOptions'] ?? [], $item['quantity']);
        }
        $totalCents = array_sum(array_column($lines, 'lineTotalCents'));

        $deliveryAddress = null;
        if ($dto['fulfillmentType'] === 'delivery' && ! empty($dto['address'])) {
            $address = $dto['address'];
            $deliveryAddress = [
                'street' => $address['street'],
                'exteriorNumber' => $address['exteriorNumber'],
                'interiorNumber' => $address['interiorNumber'] ?? null,
                'neighborhood' => $address['neighborhood'],
                'city' => $address['city'],
                'postalCode' => $address['postalCode'],
                'references' => $address['references'] ?? null,
            ];
        }

        // Remember the customer (and their address for next time).
        $customer = $this->customers->upsertWithAddress($dto['phone'], $dto['customerName'], $deliveryAddress);

        // Stock check + decrement and the order insert happen in one
        // transaction, so an order is never recorded without the inventory
        // to back it (and vice versa). Items without recipes consume nothing.
        $order = DB::transaction(function () use ($dto, $business, $customer, $totalCents, $deliveryAddress, $lines) {
            // If this order came from a manager link, consume it (single-use).
            if (! empty($dto['managedSessionToken'])) {
                $this->managedSessions->consumeForOrder($dto['managedSessionToken'], $business->id, $dto['phone']);
            }

            $this->inventory->consumeForOrder($business->id, array_map(fn ($l) => [
                'menuItemId' => $l['menuItemId'],
                'quantity' => $l['quantity'],
                'selectedOptions' => array_map(
                    fn ($o) => ['groupId' => $o['groupId'], 'optionId' => $o['optionId']],
                    $l['selectedOptions']
                ),
            ], $lines));

            $order = Order::create([
                'order_token' => $dto['orderToken'],
                'business_id' => $business->id,
                'customer_id' => $customer->id,
                'customer_name' => $dto['customerName'],
                'customer_phone' => PhoneNormalizer::normalize($dto['phone']),
                'fulfillment_type' => $dto['fulfillmentType'],
                'payment_method' => $dto['paymentMethod'],
                'status' => 'received',
                'total_cents' => $totalCents,
                'delivery_address' => $deliveryAddress,
            ]);

            foreach ($lines as $line) {
                OrderLine::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $line['menuItemId'],
                    'name' => $line['name'],
                    'unit_price_cents' => $line['unitPriceCents'],
                    'quantity' => $line['quantity'],
                    'line_total_cents' => $line['lineTotalCents'],
                    'selected_options' => $line['selectedOptions'],
                ]);
            }

            return $order;
        });

        // Consume the session token so the same draft can't be ordered twice.
        $this->draftOrders->consume($dto['orderToken']);

        return $order->load('lines');
    }

    public function findOne(string $id): Order
    {
        $order = Order::with('lines')->find($id);
        if (! $order) {
            throw new NotFoundHttpException("Order \"{$id}\" not found");
        }

        return $order;
    }
}
