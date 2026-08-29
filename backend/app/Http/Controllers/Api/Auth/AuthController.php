<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\AdminUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class AuthController extends Controller
{
    // POST /api/auth/login — validates credentials and starts a session.
    public function login(LoginRequest $request)
    {
        $email = strtolower(trim($request->validated('email')));

        if (! Auth::attempt(['email' => $email, 'password' => $request->validated('password'), 'active' => true])) {
            throw new UnauthorizedHttpException('', 'Invalid email or password');
        }

        // New session id on every login — prevents session fixation.
        $request->session()->regenerate();

        return response()->json(self::toDto(Auth::user()));
    }

    // POST /api/auth/logout — clears the session.
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['ok' => true]);
    }

    // GET /api/auth/me — the current user, or 401 if not logged in
    // (enforced by the 'auth:web' middleware on this route).
    public function me(Request $request)
    {
        return response()->json(self::toDto($request->user()));
    }

    // The public shape of the logged-in user (never expose the password hash).
    private static function toDto(AdminUser $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'role' => $user->role,
            'businessId' => $user->business_id,
            'businessSlug' => $user->business?->slug,
        ];
    }
}
