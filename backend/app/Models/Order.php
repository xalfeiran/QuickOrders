<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// A confirmed order.
class Order extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'order_token', 'business_id', 'customer_id', 'customer_name',
        'customer_phone', 'fulfillment_type', 'payment_method', 'status',
        'total_cents', 'delivery_address',
    ];

    protected $casts = [
        'total_cents' => 'integer',
        'delivery_address' => 'array',
        'created_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => 'received',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(OrderLine::class);
    }
}
