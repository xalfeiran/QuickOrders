<?php

use Illuminate\Support\Facades\Route;

// This service is an API only — the React frontend is a separate app served
// elsewhere. A hit on "/" almost always means someone opened the API host
// directly in a browser, so just confirm the service is alive.
Route::get('/', function () {
    return response()->json(['service' => 'quickorder-backend', 'status' => 'ok']);
});
