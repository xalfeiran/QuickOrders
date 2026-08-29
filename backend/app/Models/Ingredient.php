<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// A raw stock item a business consumes through recipes (e.g. "alitas" in
// grams, "aderezo bbq" in grams). Scoped to a business.
class Ingredient extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = ['business_id', 'name', 'unit', 'stock_qty', 'active'];

    protected $casts = [
        // Float rather than the string-preserving 'decimal:3' cast — every
        // consumer (InventoryService) does plain arithmetic on this value,
        // same as the old backend's numericTransformer converting it to a
        // JS number at the entity boundary.
        'stock_qty' => 'float',
        'active' => 'boolean',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
