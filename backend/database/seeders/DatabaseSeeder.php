<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database. Run with `php artisan db:seed` after
     * migrating — every seeder is idempotent, so this is also safe to
     * re-run on every deploy.
     */
    public function run(): void
    {
        $this->call([
            MenuSeeder::class,
            AdminUserSeeder::class,
            BusinessAdminSeeder::class,
            TestBusinessSeeder::class,
        ]);
    }
}
