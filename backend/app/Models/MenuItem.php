<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// A menu item stored in the database, scoped to a business. The
// public-facing id (used by the cart and orders) is item_key, e.g.
// "alitas-10"; the uuid primary key stays internal.
class MenuItem extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'business_id', 'item_key', 'name', 'description', 'price_cents',
        'category', 'available', 'sort_order', 'option_groups',
    ];

    protected $casts = [
        'available' => 'boolean',
        'price_cents' => 'integer',
        'sort_order' => 'integer',
        'option_groups' => 'array',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    // Maps a row to the public/domain menu-item shape used by pricing and
    // the customer-facing API (mirrors menu.service.ts#toModel).
    public function toPublicArray(): array
    {
        return [
            'id' => $this->item_key,
            'name' => $this->name,
            'description' => $this->description,
            'priceCents' => $this->price_cents,
            'category' => $this->category,
            'available' => $this->available,
            'optionGroups' => $this->option_groups ?? [],
        ];
    }
}
