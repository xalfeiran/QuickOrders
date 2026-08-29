<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The one active OTP for a phone number. Replaced each time a new code is
// requested. The code itself is never stored — only a keyed hash of it.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verification_tokens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // Normalised phone. One active code per number.
            $table->string('phone', 32)->unique();
            // HMAC-SHA256 of the code, bound to the phone (see
            // App\Services\VerificationOtpService).
            $table->string('code_hash', 64);
            // Failed confirm attempts against the current code; locks at the max.
            $table->unsignedInteger('attempts')->default(0);
            $table->timestamp('expires_at');
            // When the current code was last sent — enforces a resend cooldown.
            $table->timestamp('last_sent_at');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verification_tokens');
    }
};
