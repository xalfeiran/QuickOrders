<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

// The one active OTP for a phone number. Replaced each time a new code is
// requested. The code itself is never stored — only a keyed hash of it (see
// App\Services\VerificationOtpService).
class VerificationToken extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = ['phone', 'code_hash', 'attempts', 'expires_at', 'last_sent_at'];

    protected $casts = [
        'attempts' => 'integer',
        'expires_at' => 'datetime',
        'last_sent_at' => 'datetime',
        'created_at' => 'datetime',
    ];
}
