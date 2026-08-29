<?php

namespace App\Support;

// Normalises phone numbers to a consistent form so the same number always
// keys to the same customer and matches a verification grant. Keeps a
// leading "+" (country code) if present and strips everything that isn't a
// digit.
class PhoneNormalizer
{
    public static function normalize(?string $raw): string
    {
        $trimmed = trim($raw ?? '');
        $hasPlus = str_starts_with($trimmed, '+');
        $digits = preg_replace('/\D/', '', $trimmed);

        return $hasPlus ? "+{$digits}" : $digits;
    }
}
