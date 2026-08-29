<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// A returning customer, identified by their phone number. Created/updated the
// first time someone places an order with a given number.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // Normalised phone (see App\Support\PhoneNormalizer). One
            // customer per number.
            $table->string('phone', 32)->unique();
            $table->string('name', 120)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
