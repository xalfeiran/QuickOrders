<?php

use App\Support\PhoneNormalizer;

// Mirrors phone.util.spec.ts from the old NestJS backend, case for case.

it('strips spaces, dashes and parentheses', function () {
    expect(PhoneNormalizer::normalize('+52 (55) 1234-5678'))->toBe('+525512345678');
});

it('keeps a leading +', function () {
    expect(PhoneNormalizer::normalize('+525512345678'))->toBe('+525512345678');
});

it('does not invent a + when absent', function () {
    expect(PhoneNormalizer::normalize('5512345678'))->toBe('5512345678');
});

it('treats differently-spaced versions of the same number as equal', function () {
    expect(PhoneNormalizer::normalize('+52 55 1234 5678'))
        ->toBe(PhoneNormalizer::normalize('+525512345678'));
});

it('handles empty / null input', function () {
    expect(PhoneNormalizer::normalize(''))->toBe('');
    expect(PhoneNormalizer::normalize(null))->toBe('');
});
