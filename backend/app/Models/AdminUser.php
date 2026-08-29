<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;

// A dashboard user. Superadmins manage every business; business_admins are
// pinned to one business (the business relation).
class AdminUser extends Authenticatable
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = ['email', 'password_hash', 'name', 'role', 'business_id', 'active'];

    protected $hidden = ['password_hash'];

    protected $casts = [
        'active' => 'boolean',
        'created_at' => 'datetime',
    ];

    // Laravel's Auth facade calls this to find the hashed password column —
    // ours is named password_hash rather than the Laravel default "password".
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function isSuperadmin(): bool
    {
        return $this->role === 'superadmin';
    }
}
