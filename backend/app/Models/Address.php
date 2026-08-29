<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// A delivery address belonging to a customer. A customer may have several
// over time; the one with the most recent last_used_at is offered on return
// visits.
class Address extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'customer_id', 'street', 'exterior_number', 'interior_number',
        'neighborhood', 'city', 'postal_code', 'references',
        'latitude', 'longitude', 'last_used_at',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'last_used_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
