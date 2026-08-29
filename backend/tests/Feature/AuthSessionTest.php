<?php

use App\Models\AdminUser;
use App\Models\Business;
use Illuminate\Support\Facades\Hash;

it('logs in a business admin without frontend origin headers', function () {
    $business = Business::create([
        'name' => 'Alita Mia',
        'slug' => 'alita-mia',
        'phone' => '+525512345678',
        'timezone' => 'America/Mexico_City',
        'active' => true,
    ]);

    AdminUser::create([
        'email' => 'alita@mia.test',
        'password_hash' => Hash::make('secret-password'),
        'name' => 'Alita Mia Admin',
        'role' => 'business_admin',
        'business_id' => $business->id,
        'active' => true,
    ]);

    $this->postJson('/api/auth/login', [
        'email' => 'alita@mia.test',
        'password' => 'secret-password',
    ])
        ->assertOk()
        ->assertJsonPath('email', 'alita@mia.test')
        ->assertJsonPath('role', 'business_admin')
        ->assertJsonPath('businessSlug', 'alita-mia');
});

it('returns a json 401 for unauthenticated auth me requests', function () {
    $this->getJson('/api/auth/me')
        ->assertUnauthorized()
        ->assertJsonPath('message', 'Unauthenticated.');
});
