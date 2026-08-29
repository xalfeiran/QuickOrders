<?php

namespace App\Providers;

use App\Contracts\WhatsAppNotifier;
use App\Services\MockWhatsAppNotifier;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Swap this binding for a real provider (WhatsApp Cloud API /
        // Twilio) to go live — nothing else changes, since
        // VerificationOtpService only depends on the WhatsAppNotifier
        // interface.
        $this->app->bind(WhatsAppNotifier::class, MockWhatsAppNotifier::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
