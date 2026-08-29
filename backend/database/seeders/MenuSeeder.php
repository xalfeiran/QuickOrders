<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;

// Seeds the first business and its menu. Idempotent: if the default business
// already exists, it does nothing (mirrors SeedService#seedBusinessAndMenu
// in the old NestJS backend, which ran this automatically on every boot —
// here it's run explicitly via `php artisan db:seed`, since a shared host
// has no long-lived boot hook to run it from).
class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $slug = (string) config('quickorder.default_business_slug');

        if (Business::where('slug', $slug)->exists()) {
            $this->command?->info("Business \"{$slug}\" already exists — skipping menu seed.");

            return;
        }

        $business = Business::create([
            'name' => 'Alita Mía',
            'slug' => $slug,
            'phone' => null,
            'active' => true,
        ]);

        $menu = require database_path('data/menu.php');

        foreach ($menu as $index => $item) {
            MenuItem::create([
                'business_id' => $business->id,
                'item_key' => $item['id'],
                'name' => $item['name'],
                'description' => $item['description'],
                'price_cents' => $item['priceCents'],
                'category' => $item['category'],
                'available' => $item['available'],
                'sort_order' => $index,
                'option_groups' => $item['optionGroups'],
            ]);
        }

        $this->command?->info('Seeded business "'.$business->slug.'" with '.count($menu).' menu items.');
    }
}
