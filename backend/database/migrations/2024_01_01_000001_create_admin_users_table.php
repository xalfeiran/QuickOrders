<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Dashboard users. Superadmins manage every business; business_admins are
// pinned to one business (the business_id column).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // Stored lower-cased; unique across all businesses.
            $table->string('email', 160)->unique();
            $table->string('password_hash', 100);
            $table->string('name', 120);
            // 'superadmin' | 'business_admin'
            $table->string('role', 16);
            // Null for superadmins; set for business_admins.
            $table->foreignUuid('business_id')->nullable()
                ->constrained('businesses')->nullOnDelete();
            $table->boolean('active')->default(true);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_users');
    }
};
