<?php

namespace App\Http\Middleware;

use App\Services\VerificationGrantService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

// Protects endpoints that expose customer data: the caller must present a
// valid grant bound to the phone number they're asking about. The phone is
// read from the query (?phone=) or the request body.
class EnsureVerificationGrant
{
    // Header carrying the verification grant (see VerificationGrantService).
    public const GRANT_HEADER = 'x-verification-grant';

    public function __construct(private readonly VerificationGrantService $grants) {}

    public function handle(Request $request, Closure $next): Response
    {
        $phone = $request->query('phone') ?? $request->input('phone');
        $grant = $request->header(self::GRANT_HEADER);

        if (! $phone || ! $this->grants->verifyGrant($phone, $grant)) {
            throw new AccessDeniedHttpException('Phone verification required');
        }

        return $next($request);
    }
}
