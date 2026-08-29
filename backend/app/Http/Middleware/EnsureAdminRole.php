<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

// Restricts a route to the given admin roles, e.g. `->middleware('admin.role:superadmin')`
// or `->middleware('admin.role:superadmin,business_admin')`. Must run after
// the 'auth:web' middleware so the user is already resolved. Mirrors
// @Roles(...) + RolesGuard in the old NestJS backend.
class EnsureAdminRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        if (! $user || ($roles !== [] && ! in_array($user->role, $roles, true))) {
            throw new AccessDeniedHttpException('Forbidden');
        }

        return $next($request);
    }
}
