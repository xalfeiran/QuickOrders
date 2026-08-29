<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ManagedSessionService;

// Public: the customer app exchanges a link token for a verification grant.
class ManagedSessionController extends Controller
{
    public function __construct(private readonly ManagedSessionService $sessions) {}

    public function show(string $token)
    {
        return response()->json($this->sessions->resolve($token));
    }
}
