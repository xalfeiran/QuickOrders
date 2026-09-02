<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use App\Models\Business;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

// Creates the dashboard login for the default (test) business, Alita Mía,
// if it doesn't exist yet. Scoped to that one business — unlike the
// superadmin, it can't switch businesses in the dashboard. Idempotent, and
// safe to run before or after AdminUserSeeder.
class BusinessAdminSeeder extends Seeder
{
    public function run(): void
    {
        $slug = (string) config('quickorder.default_business_slug');
        $business = Business::where('slug', $slug)->first();

        if (! $business) {
            $this->command?->warn("Business \"{$slug}\" not found — skipping business admin seed. Run MenuSeeder first.");

            return;
        }

        $email = strtolower(trim((string) config('quickorder.business_admin_email')));

        if (AdminUser::where('email', $email)->exists()) {
            $this->command?->info("Admin user \"{$email}\" already exists — skipping business admin seed.");

            return;
        }

        $password = (string) config('quickorder.business_admin_password');

        AdminUser::create([
            'email' => $email,
            'password_hash' => Hash::make($password),
            'name' => "{$business->name} Admin",
            'role' => 'business_admin',
            'business_id' => $business->id,
            'active' => true,
        ]);

        $this->command?->info("Seeded business admin \"{$email}\" for \"{$business->slug}\".");
        if (! env('BUSINESS_ADMIN_PASSWORD')) {
            $this->command?->warn(
                'Business admin created with the default password "changeme" — set BUSINESS_ADMIN_PASSWORD and change it.'
            );
        }
    }
}
