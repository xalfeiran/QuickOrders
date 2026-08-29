<?php

namespace App\Services;

use App\Models\AdminUser;
use App\Models\MenuItem;
use App\Support\MenuOptionGroupNormalizer;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class AdminMenuService
{
    public function __construct(private readonly TenantResolver $tenants) {}

    public function list(AdminUser $user, ?string $slug = null): array
    {
        $businessId = $this->tenants->resolveBusinessId($user, $slug);
        if (! $businessId) {
            return [];
        }

        return MenuItem::where('business_id', $businessId)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (MenuItem $i) => self::toDto($i))
            ->all();
    }

    public function findOne(AdminUser $user, string $id): array
    {
        return self::toDto($this->load($user, $id));
    }

    public function create(AdminUser $user, ?string $slug, array $dto): array
    {
        $businessId = $this->tenants->resolveBusinessId($user, $slug);
        if (! $businessId) {
            throw new BadRequestHttpException('Selecciona un negocio');
        }

        $item = MenuItem::create([
            'business_id' => $businessId,
            'item_key' => $this->uniqueItemKey($businessId, MenuOptionGroupNormalizer::slugify($dto['name'])),
            'name' => trim($dto['name']),
            'description' => isset($dto['description']) ? trim($dto['description']) : '',
            'price_cents' => $dto['priceCents'],
            'category' => trim($dto['category']),
            'available' => $dto['available'] ?? true,
            'sort_order' => $dto['sortOrder'] ?? 0,
            'option_groups' => MenuOptionGroupNormalizer::normalize($dto['optionGroups'] ?? null),
        ]);

        return self::toDto($item);
    }

    public function update(AdminUser $user, string $id, array $dto): array
    {
        $item = $this->load($user, $id);
        $item->name = trim($dto['name']);
        $item->description = isset($dto['description']) ? trim($dto['description']) : '';
        $item->price_cents = $dto['priceCents'];
        $item->category = trim($dto['category']);
        if (array_key_exists('available', $dto) && $dto['available'] !== null) {
            $item->available = $dto['available'];
        }
        if (array_key_exists('sortOrder', $dto) && $dto['sortOrder'] !== null) {
            $item->sort_order = $dto['sortOrder'];
        }
        $item->option_groups = MenuOptionGroupNormalizer::normalize($dto['optionGroups'] ?? null);
        $item->save();

        return self::toDto($item);
    }

    public function setAvailability(AdminUser $user, string $id, bool $available): array
    {
        $item = $this->load($user, $id);
        $item->available = $available;
        $item->save();

        return self::toDto($item);
    }

    public function remove(AdminUser $user, string $id): array
    {
        $item = $this->load($user, $id);
        $item->delete();

        return ['ok' => true];
    }

    // Loads an item with its business and enforces tenant access.
    private function load(AdminUser $user, string $id): MenuItem
    {
        $item = MenuItem::with('business')->find($id);
        if (! $item) {
            throw new NotFoundHttpException('Platillo no encontrado');
        }
        TenantResolver::assertBusinessAccess($user, $item->business_id);

        return $item;
    }

    // Ensures the generated item_key is unique within the business.
    private function uniqueItemKey(string $businessId, string $base): string
    {
        $taken = MenuItem::where('business_id', $businessId)->pluck('item_key')->all();
        $taken = array_flip($taken);
        $key = $base;
        $n = 2;
        while (isset($taken[$key])) {
            $key = "{$base}-{$n}";
            $n++;
        }

        return $key;
    }

    private static function toDto(MenuItem $e): array
    {
        return [
            'id' => $e->id,
            'itemKey' => $e->item_key,
            'name' => $e->name,
            'description' => $e->description,
            'priceCents' => $e->price_cents,
            'category' => $e->category,
            'available' => $e->available,
            'sortOrder' => $e->sort_order,
            'optionGroups' => $e->option_groups ?? [],
            // Present when the item was loaded with its business (findOne);
            // used by the recipe editor to fetch that business's ingredients.
            'businessSlug' => $e->relationLoaded('business') && $e->business ? $e->business->slug : null,
        ];
    }
}
