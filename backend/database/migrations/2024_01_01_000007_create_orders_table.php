<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// A confirmed order.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // The draft/session token this order was placed from (traceability).
            $table->uuid('order_token');
            $table->foreignUuid('business_id')->nullable()
                ->constrained('businesses')->nullOnDelete();
            $table->foreignUuid('customer_id')->nullable()
                ->constrained('customers')->nullOnDelete();
            // Name/phone captured at order time (snapshot, independent of the
            // customer record which may change later).
            $table->string('customer_name', 120);
            $table->string('customer_phone', 32);
            // 'pickup' | 'delivery'
            $table->string('fulfillment_type', 16);
            // 'cash' | 'card'
            $table->string('payment_method', 16);
            // 'received' | 'preparing' | 'ready' | 'completed'
            $table->string('status', 16)->default('received');
            $table->unsignedInteger('total_cents');
            // Present only for delivery orders. Snapshotted so it never
            // changes if the customer later edits their saved address.
            $table->json('delivery_address')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
