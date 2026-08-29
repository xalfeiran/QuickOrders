<?php

use App\Http\Controllers\Api\Admin\AdminBusinessController;
use App\Http\Controllers\Api\Admin\AdminInventoryController;
use App\Http\Controllers\Api\Admin\AdminMenuController;
use App\Http\Controllers\Api\Admin\AdminOrderController;
use App\Http\Controllers\Api\Admin\AdminOrderLinkController;
use App\Http\Controllers\Api\Admin\AdminRecipeController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\BusinessController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DraftOrderController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\ManagedSessionController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\VerificationController;
use Illuminate\Support\Facades\Route;

// Every route here is mounted under /api (see bootstrap/app.php). Grouped in
// the same order as the old NestJS module list so the two are easy to
// compare route-for-route.

Route::get('health', [HealthController::class, 'check']);

// ----- Public menu -----
Route::get('menu', [MenuController::class, 'indexDefault']);
Route::get('menu/{id}', [MenuController::class, 'showDefault']);
Route::get('b/{slug}', [BusinessController::class, 'show']);
Route::get('b/{slug}/menu', [MenuController::class, 'indexForBusiness']);
Route::get('b/{slug}/menu/{id}', [MenuController::class, 'showForBusiness']);

// ----- Draft orders (order-session token) -----
Route::post('orders/draft', [DraftOrderController::class, 'store']);
Route::get('orders/draft/{token}', [DraftOrderController::class, 'show']);

// ----- Phone verification (WhatsApp OTP) -----
Route::post('verify/request', [VerificationController::class, 'request']);
Route::post('verify/confirm', [VerificationController::class, 'confirm']);

// ----- Manager-issued pre-verified links -----
Route::get('sessions/{token}', [ManagedSessionController::class, 'show']);

// ----- Customers + order confirmation (require a verification grant) -----
Route::middleware('verify.grant')->group(function () {
    Route::get('customers/lookup', [CustomerController::class, 'lookup']);
    Route::post('orders/confirm', [OrderController::class, 'confirm']);
});

Route::get('orders/{id}', [OrderController::class, 'show']);

Route::middleware('admin.session')->group(function () {
    // ----- Admin dashboard auth (session cookie via Sanctum's statefulApi) -----
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me'])->middleware('auth:web');

    // ----- Admin dashboard API -----
    Route::middleware(['auth:web', 'admin.role:superadmin,business_admin'])
        ->prefix('admin')
        ->group(function () {
            Route::get('orders', [AdminOrderController::class, 'index']);
            Route::get('orders/{id}', [AdminOrderController::class, 'show']);
            Route::patch('orders/{id}/status', [AdminOrderController::class, 'updateStatus']);

            Route::get('menu', [AdminMenuController::class, 'index']);
            Route::get('menu/{id}', [AdminMenuController::class, 'show']);
            Route::post('menu', [AdminMenuController::class, 'store']);
            Route::put('menu/{id}', [AdminMenuController::class, 'update']);
            Route::patch('menu/{id}/availability', [AdminMenuController::class, 'setAvailability']);
            Route::delete('menu/{id}', [AdminMenuController::class, 'destroy']);

            Route::get('menu/{id}/recipe', [AdminRecipeController::class, 'show']);
            Route::put('menu/{id}/recipe', [AdminRecipeController::class, 'update']);

            Route::get('inventory', [AdminInventoryController::class, 'index']);
            Route::post('inventory', [AdminInventoryController::class, 'store']);
            Route::put('inventory/{id}', [AdminInventoryController::class, 'update']);
            Route::delete('inventory/{id}', [AdminInventoryController::class, 'destroy']);

            Route::post('order-links', [AdminOrderLinkController::class, 'store']);
        });

    // Superadmin-only.
    Route::middleware(['auth:web', 'admin.role:superadmin'])
        ->prefix('admin')
        ->group(function () {
            Route::get('businesses', [AdminBusinessController::class, 'index']);
        });
});
