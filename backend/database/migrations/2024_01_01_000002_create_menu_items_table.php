<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// A menu item, scoped to a business. The public-facing id (used by the cart
// and orders) is item_key, e.g. "alitas-10"; the uuid primary key is internal.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            // Stable, human-readable id unique within the business.
            $table->string('item_key', 64);
            $table->string('name', 160);
            $table->text('description')->default('');
            $table->unsignedInteger('price_cents');
            $table->string('category', 80);
            $table->boolean('available')->default(true);
            $table->integer('sort_order')->default(0);
            // The full option-group structure as one JSON column (see
            // App\Support\MenuOptionGroupNormalizer).
            $table->json('option_groups');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['business_id', 'item_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
