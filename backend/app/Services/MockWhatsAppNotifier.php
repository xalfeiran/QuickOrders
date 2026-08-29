<?php

namespace App\Services;

use App\Contracts\WhatsAppNotifier;
use Illuminate\Support\Facades\Log;

// Development implementation: doesn't send anything, just logs the code so
// you can complete the flow locally. Never use in production.
class MockWhatsAppNotifier implements WhatsAppNotifier
{
    public function sendVerificationCode(string $phone, string $code): void
    {
        Log::channel(config('logging.default'))
            ->info("WhatsApp(mock) Verification code for {$phone}: {$code}");
    }
}
