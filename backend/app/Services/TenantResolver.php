<?php

namespace App\Services;

use App\Models\AdminUser;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class TenantResolver
{
    public function __construct(private readonly BusinessService $businesses) {}

    // Resolves which business an admin may act on for list/create operations:
    //   business_admin -> their own (any requested slug is ignored)
    //   superadmin     -> the requested business, or null when none is selected
    public function resolveBusinessId(AdminUser $user, ?string $slug): ?string
    {
        if ($user->role === 'business_admin') {
            return $user->business_id;
        }
        if (! $slug) {
            return null;
        }

        return $this->businesses->findBySlug($slug)->id;
    }

    // Guards a resource loaded by id: a business_admin may only touch their
    // own business's data. We throw 404 (not 403) so cross-tenant existence
    // isn't leaked. Superadmins pass through.
    public static function assertBusinessAccess(AdminUser $user, ?string $businessId): void
    {
        if ($user->role === 'superadmin') {
            return;
        }
        $own = $user->business_id;
        if (! $own || ! $businessId || $businessId !== $own) {
            throw new NotFoundHttpException('Recurso no encontrado');
        }
    }
}
