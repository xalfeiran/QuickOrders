<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// One line of a menu item's recipe: how much of an ingredient is consumed,
// either by the base item (scope 'base') or by a specific option (scope
// 'option', identified by its group + option id within the item).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipe_components', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('menu_item_id')->constrained('menu_items')->cascadeOnDelete();
            // 'base' | 'option'
            $table->string('scope', 8);
            $table->string('option_group_id', 64)->nullable();
            $table->string('option_id', 64)->nullable();
            $table->foreignUuid('ingredient_id')->constrained('ingredients')->cascadeOnDelete();
            $table->decimal('quantity', 12, 3);
            $table->timestamp('created_at')->useCurrent();

            $table->index('menu_item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipe_components');
    }
};
