<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// A delivery address belonging to a customer. A customer may have several
// over time; the one with the most recent last_used_at is offered on return
// visits.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('street', 160);
            $table->string('exterior_number', 32);
            $table->string('interior_number', 32)->nullable();
            $table->string('neighborhood', 120);
            $table->string('city', 120);
            $table->string('postal_code', 12);
            // Free-text landmarks / delivery notes.
            $table->text('references')->nullable();
            $table->double('latitude')->nullable();
            $table->double('longitude')->nullable();
            $table->timestamp('last_used_at');
            $table->timestamp('created_at')->useCurrent();

            // Supports "most recently used address for this customer".
            $table->index(['customer_id', 'last_used_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
