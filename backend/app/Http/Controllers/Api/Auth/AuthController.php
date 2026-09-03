<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Models\AdminUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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

    // PUT /api/auth/password — the logged-in user changes their own
    // password. Secured the same way as GET /api/auth/me: the 'auth:web'
    // middleware on this route rejects the request with a 401 before this
    // method ever runs if there's no valid session, and on top of that the
    // caller must also prove they know the current password (see
    // ChangePasswordRequest) — a session cookie alone isn't enough.
    public function changePassword(ChangePasswordRequest $request)
    {
        $user = $request->user();

        if (! Hash::check($request->validated('currentPassword'), $user->password_hash)) {
            throw new UnauthorizedHttpException('', 'Current password is incorrect');
        }

        $user->password_hash = Hash::make($request->validated('newPassword'));
        $user->save();

        // New session id so a leaked old session token can't outlive the
        // password change.
        $request->session()->regenerate();

        return response()->json(['ok' => true]);
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
