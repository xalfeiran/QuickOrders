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

    // Seeded business_admin for the default (test) business, Alita Mía
    // (see database/seeders/BusinessAdminSeeder.php).
    'business_admin_email' => env('BUSINESS_ADMIN_EMAIL', 'alita-mia@quickorder.local'),
    'business_admin_password' => env('BUSINESS_ADMIN_PASSWORD', 'changeme'),

    // Slug of the business seeded on first boot. The legacy single-business
    // endpoints (/api/menu, /orders/draft without a businessSlug) resolve to it.
    'default_business_slug' => env('DEFAULT_BUSINESS_SLUG', 'alita-mia'),

    // Seeded second business, purely for trying out multi-business behavior
    // (the superadmin business switcher, tenant isolation) — does not affect
    // the default business above (see database/seeders/TestBusinessSeeder.php).
    'test_business_slug' => env('TEST_BUSINESS_SLUG', 'test-kitchen'),
    'test_business_name' => env('TEST_BUSINESS_NAME', 'QuickOrder Test Kitchen'),
    'test_business_admin_email' => env('TEST_BUSINESS_ADMIN_EMAIL', 'test-kitchen@quickorder.local'),
    'test_business_admin_password' => env('TEST_BUSINESS_ADMIN_PASSWORD', 'changeme'),

];
