<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Every test boots the full app (needed for config()/env()-backed services
// like VerificationGrantService) and gets a fresh sqlite :memory: database
// per test (see phpunit.xml) for the tests that touch models.
pest()->extend(TestCase::class)->use(RefreshDatabase::class)->in('Unit', 'Feature');
