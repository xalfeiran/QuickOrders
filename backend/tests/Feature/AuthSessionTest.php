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

it('changes the logged-in users password when the current password is correct', function () {
    $user = AdminUser::create([
        'email' => 'owner@quickorder.test',
        'password_hash' => Hash::make('old-password'),
        'name' => 'Owner',
        'role' => 'superadmin',
        'active' => true,
    ]);

    $this->actingAs($user)
        ->putJson('/api/auth/password', [
            'currentPassword' => 'old-password',
            'newPassword' => 'new-password-123',
        ])
        ->assertOk()
        ->assertJsonPath('ok', true);

    expect(Hash::check('new-password-123', $user->fresh()->password_hash))->toBeTrue();
});

it('rejects a password change with the wrong current password', function () {
    $user = AdminUser::create([
        'email' => 'owner2@quickorder.test',
        'password_hash' => Hash::make('old-password'),
        'name' => 'Owner',
        'role' => 'superadmin',
        'active' => true,
    ]);

    $this->actingAs($user)
        ->putJson('/api/auth/password', [
            'currentPassword' => 'wrong-password',
            'newPassword' => 'new-password-123',
        ])
        ->assertUnauthorized();

    expect(Hash::check('old-password', $user->fresh()->password_hash))->toBeTrue();
});

it('rejects a password change without a session', function () {
    $this->putJson('/api/auth/password', [
        'currentPassword' => 'old-password',
        'newPassword' => 'new-password-123',
    ])
        ->assertUnauthorized()
        ->assertJsonPath('message', 'Unauthenticated.');
});

it('rejects a new password shorter than 8 characters', function () {
    $user = AdminUser::create([
        'email' => 'owner3@quickorder.test',
        'password_hash' => Hash::make('old-password'),
        'name' => 'Owner',
        'role' => 'superadmin',
        'active' => true,
    ]);

    $this->actingAs($user)
        ->putJson('/api/auth/password', [
            'currentPassword' => 'old-password',
            'newPassword' => 'short',
        ])
        ->assertStatus(422);
});
