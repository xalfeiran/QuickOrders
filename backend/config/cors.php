<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | The React frontend runs on a different origin than this API, so every
    | browser request needs an explicit CORS allowance. `supports_credentials`
    | must stay true — the admin dashboard's session cookie only rides along
    | on cross-origin requests when both sides opt in.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Comma-separated in .env, e.g. CORS_ORIGIN=http://localhost:5173,https://order.example.com
    'allowed_origins' => array_filter(explode(',', env('CORS_ORIGIN', 'http://localhost:5173'))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
