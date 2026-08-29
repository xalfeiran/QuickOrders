<?php

return [

    // Signs phone-verification grants and OTP hashes (see
    // App\Services\VerificationGrantService / VerificationOtpService).
    // Anyone with this value can forge a verified-phone grant — set a long
    // random one in production.
    'verification_secret' => env('VERIFICATION_SECRET', 'dev-insecure-secret-change-me'),

    // Seeded superadmin (see database/seeders/AdminUserSeeder.php).
    'admin_email' => env('ADMIN_EMAIL', 'admin@quickorder.local'),
    'admin_password' => env('ADMIN_PASSWORD', 'changeme'),

    // Slug of the business seeded on first boot. The legacy single-business
    // endpoints (/api/menu, /orders/draft without a businessSlug) resolve to it.
    'default_business_slug' => env('DEFAULT_BUSINESS_SLUG', 'alita-mia'),

];
