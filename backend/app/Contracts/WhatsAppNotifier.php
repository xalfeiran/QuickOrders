<?php

namespace App\Contracts;

// Seam for delivering verification codes over WhatsApp. Swap the binding in
// App\Providers\AppServiceProvider for a real provider (WhatsApp Cloud API /
// Twilio) without touching VerificationOtpService — it only depends on this
// interface.
interface WhatsAppNotifier
{
    public function sendVerificationCode(string $phone, string $code): void;
}
