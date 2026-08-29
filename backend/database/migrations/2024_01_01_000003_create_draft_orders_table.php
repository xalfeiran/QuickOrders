<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// A server-side order session created the moment a customer starts ordering.
// The opaque `token` is handed to the browser and used throughout checkout.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('draft_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // Opaque handle given to the client. Separate from the primary
            // key so the internal id is never exposed.
            $table->uuid('token')->unique();
            $table->foreignUuid('business_id')->nullable()
                ->constrained('businesses')->cascadeOnDelete();
            // 'draft' | 'confirmed' | 'expired'
            $table->string('status', 16)->default('draft');
            // Cart contents. Empty until synced at checkout.
            $table->json('items');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            // After this moment the draft is considered abandoned and may be
            // purged. Indexed — see App\Services\DraftOrderService::purgeExpired().
            $table->timestamp('expires_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('draft_orders');
    }
};
