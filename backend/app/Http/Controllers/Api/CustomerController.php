<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CustomerService;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function __construct(private readonly CustomerService $customers) {}

    // GET /api/customers/lookup?phone=... — tells the checkout flow whether
    // the number is registered and returns its last address to prefill.
    //
    // Guarded by the 'verify.grant' middleware: the caller must present a
    // valid verification grant for this phone, so addresses are never
    // exposed to an unverified request.
    public function lookup(Request $request)
    {
        $found = $this->customers->findByPhone((string) $request->query('phone'));
        if (! $found) {
            return response()->json(['registered' => false, 'name' => null, 'lastAddress' => null]);
        }

        return response()->json([
            'registered' => true,
            'name' => $found['customer']->name,
            'lastAddress' => $found['lastAddress'],
        ]);
    }
}
