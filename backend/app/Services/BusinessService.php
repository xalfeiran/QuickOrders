<?php

namespace App\Services;

use App\Models\Business;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class BusinessService
{
    public function findBySlug(string $slug): Business
    {
        $business = Business::where('slug', $slug)->where('active', true)->first();
        if (! $business) {
            throw new NotFoundHttpException("Business \"{$slug}\" not found");
        }

        return $business;
    }

    // The default tenant, used by the not-yet-business-aware customer endpoints.
    public function getDefault(): Business
    {
        return $this->findBySlug((string) config('quickorder.default_business_slug'));
    }
}
