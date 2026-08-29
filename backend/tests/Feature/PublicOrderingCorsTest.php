<?php

use App\Models\Business;

it('creates draft orders from an allowed LAN frontend origin without csrf', function () {
    Business::create([
        'name' => 'Alita Mia',
        'slug' => 'alita-mia',
        'phone' => '+525512345678',
        'timezone' => 'America/Mexico_City',
        'active' => true,
    ]);

    config(['cors.allowed_origins' => ['http://192.168.5.220:8080']]);

    $this
        ->withHeader('Origin', 'http://192.168.5.220:8080')
        ->postJson('/api/orders/draft', ['businessSlug' => 'alita-mia'])
        ->assertOk()
        ->assertHeader('Access-Control-Allow-Origin', 'http://192.168.5.220:8080')
        ->assertJsonStructure(['orderToken', 'expiresAt']);
});
