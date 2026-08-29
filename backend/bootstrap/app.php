<?php

use App\Http\Middleware\EnsureAdminRole;
use App\Http\Middleware\EnsureVerificationGrant;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        // Everything the frontend talks to. Automatically mounted under
        // "/api" (apiPrefix defaults to 'api'), mirroring app.setGlobalPrefix
        // in the old NestJS backend so the React app's VITE_API_BASE_URL
        // doesn't need to change.
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Expo/mobile requests do not always send Origin/Referer headers,
        // so admin auth endpoints attach encrypted cookie session support
        // explicitly. Public ordering endpoints stay stateless and do not
        // require CSRF tokens.
        $middleware->group('admin.session', [
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
        ]);

        // This API has no login page. Leaving Laravel's default redirect in
        // place makes auth:web failures try route('login'), which becomes a
        // 500 when an unauthenticated mobile app calls /api/auth/me.
        $middleware->redirectGuestsTo(fn (Request $request) => null);

        $middleware->alias([
            'verify.grant' => EnsureVerificationGrant::class,
            'admin.role' => EnsureAdminRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // This service is API-only — there is no login page to redirect to.
        // An unauthenticated admin request (GET /api/auth/me without a
        // session, or a protected /api/admin/* route) should always get a
        // plain 401 JSON body, mirroring AuthenticatedGuard in the old
        // NestJS backend, instead of Laravel's default redirect-to-login
        // behaviour for requests that didn't ask for JSON explicitly.
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        });
    })->create();
