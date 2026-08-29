<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

// Creates the initial superadmin if there are no admin users yet. Idempotent
// (mirrors SeedService#seedSuperadmin in the old NestJS backend).
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        if (AdminUser::count() > 0) {
            $this->command?->info('Admin users already exist — skipping superadmin seed.');

            return;
        }

        $email = strtolower(trim((string) config('quickorder.admin_email')));
        $password = (string) config('quickorder.admin_password');

        AdminUser::create([
            'email' => $email,
            'password_hash' => Hash::make($password),
            'name' => 'Super Admin',
            'role' => 'superadmin',
            'business_id' => null,
            'active' => true,
        ]);

        $this->command?->info("Seeded superadmin \"{$email}\".");
        if (! env('ADMIN_PASSWORD')) {
            $this->command?->warn(
                'Superadmin created with the default password "changeme" — set ADMIN_PASSWORD and change it.'
            );
        }
    }
}
