<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// One tenant: one restaurant/brand. Menu and orders are scoped to a business.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('businesses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 120);
            // URL-friendly identifier used in public routes (/api/b/{slug}).
            $table->string('slug', 80)->unique();
            $table->string('phone', 32)->nullable();
            $table->string('timezone', 64)->default('America/Mexico_City');
            $table->boolean('active')->default(true);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('businesses');
    }
};
