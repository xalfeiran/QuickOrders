<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// A server-side order session created the moment a customer starts ordering.
// The opaque `token` is handed to the browser and used throughout checkout.
class DraftOrder extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = ['token', 'business_id', 'status', 'items', 'expires_at'];

    protected $casts = [
        'items' => 'array',
        'expires_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => 'draft',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
