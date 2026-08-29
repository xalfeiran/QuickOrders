<?php

namespace App\Services;

use App\Models\DraftOrder;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\GoneHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class DraftOrderService
{
    // How long a draft order stays valid before it's considered abandoned.
    private const DRAFT_TTL_MINUTES = 2 * 60; // 2 hours

    public function __construct(private readonly BusinessService $businesses) {}

    // Starts an order session: mints a token and persists an empty draft.
    // When no business slug is given (legacy single-tenant app) it defaults
    // to the seeded business.
    public function create(?string $businessSlug = null): DraftOrder
    {
        // Clean up abandoned drafts opportunistically — cheap, and avoids
        // needing a separate scheduler at this scale. Swap for a scheduled
        // command (App\Console\Kernel) if volume grows.
        $this->purgeExpired();

        $business = $businessSlug
            ? $this->businesses->findBySlug($businessSlug)
            : $this->businesses->getDefault();

        return DraftOrder::create([
            'token' => (string) Str::uuid(),
            'status' => 'draft',
            'items' => [],
            'business_id' => $business->id,
            'expires_at' => now()->addMinutes(self::DRAFT_TTL_MINUTES),
        ]);
    }

    // Looks up a draft by its public token (with its business). Throws 404
    // if unknown, 410 if expired (so the client knows to start a fresh
    // session).
    public function findActiveByToken(string $token): DraftOrder
    {
        $draft = DraftOrder::with('business')->where('token', $token)->first();
        if (! $draft) {
            throw new NotFoundHttpException('Order session not found');
        }
        if ($draft->expires_at->isPast()) {
            throw new GoneHttpException('Order session has expired');
        }

        return $draft;
    }

    // Removes a draft once its order has been placed, so it can't be reused.
    public function consume(string $token): void
    {
        DraftOrder::where('token', $token)->delete();
    }

    // Deletes drafts whose expiry has passed.
    private function purgeExpired(): void
    {
        DraftOrder::where('expires_at', '<', now())->delete();
    }
}
