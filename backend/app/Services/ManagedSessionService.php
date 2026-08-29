<?php

namespace App\Services;

use App\Models\AdminUser;
use App\Models\Business;
use App\Models\ManagedSession;
use App\Support\PhoneNormalizer;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ForbiddenHttpException;
use Symfony\Component\HttpKernel\Exception\GoneHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ManagedSessionService
{
    // How long a link stays valid after the manager creates it.
    private const LINK_TTL_HOURS = 24;

    public function __construct(
        private readonly BusinessService $businesses,
        private readonly VerificationGrantService $grants,
    ) {}

    // Manager creates a link for a customer phone (tenant-scoped).
    public function create(AdminUser $user, ?string $slug, string $rawPhone): array
    {
        $business = $this->resolveBusiness($user, $slug);
        $phone = PhoneNormalizer::normalize($rawPhone);
        if (strlen(preg_replace('/\D/', '', $phone)) < 7) {
            throw new BadRequestHttpException('Teléfono inválido');
        }

        $session = ManagedSession::create([
            'business_id' => $business->id,
            'token' => (string) Str::uuid(),
            'phone' => $phone,
            'expires_at' => now()->addHours(self::LINK_TTL_HOURS),
            'consumed_at' => null,
            'created_by' => $user->id,
        ]);

        return [
            'token' => $session->token,
            'phone' => $session->phone,
            'businessSlug' => $business->slug,
            'path' => "/b/{$business->slug}/s/{$session->token}",
            'expiresAt' => $session->expires_at,
        ];
    }

    // Customer opens the link: validate and hand back a verification grant
    // for the phone (no WhatsApp code — the manager vouched). Does not
    // consume the session.
    public function resolve(string $token): array
    {
        $session = ManagedSession::with('business')->where('token', $token)->first();
        if (! $session) {
            throw new NotFoundHttpException('Enlace no encontrado');
        }
        if ($session->consumed_at) {
            throw new GoneHttpException('El enlace ya fue usado');
        }
        if ($session->expires_at->isPast()) {
            throw new GoneHttpException('El enlace expiró');
        }

        return [
            'token' => $session->token,
            'phone' => $session->phone,
            'businessSlug' => $session->business->slug,
            'grant' => $this->grants->issueGrant($session->phone),
            'expiresAt' => $session->expires_at,
        ];
    }

    // Marks a session consumed at order placement (runs inside the order
    // transaction). Validates it belongs to the same business + phone.
    public function consumeForOrder(string $token, string $businessId, string $rawPhone): void
    {
        $session = ManagedSession::where('token', $token)->first();
        if (! $session) {
            throw new NotFoundHttpException('Enlace no encontrado');
        }
        if ($session->consumed_at) {
            throw new GoneHttpException('El enlace ya fue usado');
        }
        if ($session->expires_at->isPast()) {
            throw new GoneHttpException('El enlace expiró');
        }
        if ($session->business_id !== $businessId || $session->phone !== PhoneNormalizer::normalize($rawPhone)) {
            throw new BadRequestHttpException('El enlace no corresponde a este pedido');
        }
        $session->consumed_at = now();
        $session->save();
    }

    private function resolveBusiness(AdminUser $user, ?string $slug): Business
    {
        if ($user->role === 'business_admin') {
            if (! $user->business_id) {
                throw new ForbiddenHttpException('Sin negocio asignado');
            }

            return $user->business;
        }
        if (! $slug) {
            throw new BadRequestHttpException('Selecciona un negocio');
        }

        return $this->businesses->findBySlug($slug);
    }
}
