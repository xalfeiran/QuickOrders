<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

// Liveness + readiness probe for uptime checks. Reports overall status and
// database connectivity.
class HealthController extends Controller
{
    public function check()
    {
        $dbUp = $this->pingDatabase();
        $report = [
            'status' => $dbUp ? 'ok' : 'degraded',
            'db' => $dbUp ? 'up' : 'down',
            'timestamp' => now()->toIsoString(),
        ];

        // Surface a failing DB as 503 so orchestrators/monitors see the API
        // as unhealthy.
        if ($report['status'] !== 'ok') {
            throw new ServiceUnavailableHttpException(null, json_encode($report));
        }

        return response()->json($report);
    }

    private function pingDatabase(): bool
    {
        try {
            DB::select('select 1');

            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
