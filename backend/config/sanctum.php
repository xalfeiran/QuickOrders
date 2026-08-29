<?php

use Laravel\Sanctum\Sanctum;

return [

    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    |
    | Requests from these origins get the cookie-session treatment (admin
    | login) instead of needing a bearer token. Set to the frontend's host(s)
    | — e.g. localhost:5173 in dev, order.example.com in production. Sanctum
    | already includes localhost/127.0.0.1 variants and the app's own URL.
    |
    */

    'stateful' => explode(',', (string) env(
        'SANCTUM_STATEFUL_DOMAINS',
        sprintf(
            '%s%s',
            'localhost,localhost:3000,localhost:5173,127.0.0.1,127.0.0.1:8000,::1',
            Sanctum::currentApplicationUrlWithPort()
                ? ','.Sanctum::currentApplicationUrlWithPort()
                : ''
        )
    )),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guards
    |--------------------------------------------------------------------------
    |
    | This value controls which of the authentication guards are checked when
    | Sanctum is trying to authenticate a stateful request. Only the "web"
    | guard is needed — the admin dashboard is the only stateful consumer.
    |
    */

    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    |
    | Not used for stateful (cookie) sessions — session lifetime is governed
    | by config/session.php instead. Left null (tokens, if ever issued,
    | never expire).
    |
    */

    'expiration' => null,

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Middleware
    |--------------------------------------------------------------------------
    */

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],

];
