<?php

use App\Services\VerificationGrantService;

// Mirrors verification-grant.service.spec.ts from the old NestJS backend,
// case for case.

it('accepts a freshly issued grant for the same number', function () {
    $grants = new VerificationGrantService;
    $grant = $grants->issueGrant('+52 55 1234 5678');
    expect($grants->verifyGrant('+525512345678', $grant))->toBeTrue();
});

it('matches regardless of phone formatting', function () {
    $grants = new VerificationGrantService;
    $grant = $grants->issueGrant('+525512345678');
    expect($grants->verifyGrant('+52 55 1234 5678', $grant))->toBeTrue();
});

it('rejects a grant for a different number', function () {
    $grants = new VerificationGrantService;
    $grant = $grants->issueGrant('+525512345678');
    expect($grants->verifyGrant('+525500000000', $grant))->toBeFalse();
});

it('rejects a missing grant', function () {
    $grants = new VerificationGrantService;
    expect($grants->verifyGrant('+525512345678', null))->toBeFalse();
});

it('rejects a tampered signature', function () {
    $grants = new VerificationGrantService;
    $grant = $grants->issueGrant('+525512345678');
    $body = explode('.', $grant)[0];
    expect($grants->verifyGrant('+525512345678', "{$body}.deadbeef"))->toBeFalse();
});

it('rejects an expired grant', function () {
    $grants = new VerificationGrantService;
    $grant = $grants->issueGrant('+525512345678', -1000);
    expect($grants->verifyGrant('+525512345678', $grant))->toBeFalse();
});

it('rejects a forged payload (signature will not match)', function () {
    $grants = new VerificationGrantService;
    $valid = $grants->issueGrant('+525512345678');
    $forgedBody = rtrim(strtr(base64_encode(json_encode([
        'phone' => '+525500000000',
        'exp' => (int) round(microtime(true) * 1000) + 99999,
    ])), '+/', '-_'), '=');
    $forged = "{$forgedBody}.".explode('.', $valid)[1];
    expect($grants->verifyGrant('+525500000000', $forged))->toBeFalse();
});
