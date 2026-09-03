<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use App\Models\Business;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

// Seeds a second, clearly-marked test business alongside the real one (Alita
// Mía) plus a business_admin account scoped to it. Useful for trying out
// multi-business behavior (the superadmin's business switcher, tenant
// isolation) without touching any real business's data.
//
// Independent of MenuSeeder / BusinessAdminSeeder: it never looks at or
// modifies the default business, and it's idempotent the same way they are —
// skips creating the business if its slug already exists, and skips the
// admin user if that email is already taken.
class TestBusinessSeeder extends Seeder
{
    public function run(): void
    {
        $business = $this->seedBusiness();
        $this->seedBusinessAdmin($business);
    }

    private function seedBusiness(): Business
    {
        $slug = (string) config('quickorder.test_business_slug');

        $existing = Business::where('slug', $slug)->first();
        if ($existing) {
            $this->command?->info("Business \"{$slug}\" already exists — skipping test business seed.");

            return $existing;
        }

        $business = Business::create([
            'name' => (string) config('quickorder.test_business_name'),
            'slug' => $slug,
            'phone' => null,
            'active' => true,
        ]);

        foreach ($this->sampleMenu() as $index => $item) {
            MenuItem::create([
                'business_id' => $business->id,
                'item_key' => $item['id'],
                'name' => $item['name'],
                'description' => $item['description'],
                'price_cents' => $item['priceCents'],
                'category' => $item['category'],
                'available' => true,
                'sort_order' => $index,
                'option_groups' => [],
            ]);
        }

        $this->command?->info('Seeded test business "'.$business->slug.'" with '.count($this->sampleMenu()).' menu items.');

        return $business;
    }

    private function seedBusinessAdmin(Business $business): void
    {
        $email = strtolower(trim((string) config('quickorder.test_business_admin_email')));

        if (AdminUser::where('email', $email)->exists()) {
            $this->command?->info("Admin user \"{$email}\" already exists — skipping test business admin seed.");

            return;
        }

        $password = (string) config('quickorder.test_business_admin_password');

        AdminUser::create([
            'email' => $email,
            'password_hash' => Hash::make($password),
            'name' => "{$business->name} Admin",
            'role' => 'business_admin',
            'business_id' => $business->id,
            'active' => true,
        ]);

        $this->command?->info("Seeded business admin \"{$email}\" for \"{$business->slug}\".");
        if (! env('TEST_BUSINESS_ADMIN_PASSWORD')) {
            $this->command?->warn(
                'Test business admin created with the default password "changeme" — set TEST_BUSINESS_ADMIN_PASSWORD and change it.'
            );
        }
    }

    // A handful of generic sample items — just enough for the dashboard and
    // ordering flow to have something to show. Deliberately simple (no
    // option groups, no localization) since this business exists for
    // testing, not real sales.
    private function sampleMenu(): array
    {
        return [
            [
                'id' => 'test-burger', 'name' => 'Test Burger',
                'description' => 'Sample item for testing the ordering flow.', 'priceCents' => 8900,
                'category' => 'Test Menu',
            ],
            [
                'id' => 'test-fries', 'name' => 'Test Fries',
                'description' => 'Sample item for testing the ordering flow.', 'priceCents' => 4500,
                'category' => 'Test Menu',
            ],
            [
                'id' => 'test-soda', 'name' => 'Test Soda',
                'description' => 'Sample item for testing the ordering flow.', 'priceCents' => 3000,
                'category' => 'Test Menu',
            ],
        ];
    }
}
