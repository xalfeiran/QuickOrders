<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// A manager-created, single-use, expiring link that pre-verifies a
// customer's phone for a business — so the customer can order without the
// WhatsApp code step. Consumed when the order is placed.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('managed_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            // Opaque handle embedded in the shareable link.
            $table->uuid('token')->unique();
            $table->string('phone', 32);
            $table->timestamp('expires_at');
            // Set when an order is placed from this link; blocks reuse.
            $table->timestamp('consumed_at')->nullable();
            $table->foreignUuid('created_by')->nullable()
                ->constrained('admin_users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('managed_sessions');
    }
};
