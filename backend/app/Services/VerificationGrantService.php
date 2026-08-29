<?php

namespace App\Services;

use App\Support\PhoneNormalizer;

// Issues and verifies short-lived, phone-bound "grants". A grant is proof
// that a phone number was verified (VerificationOtpService issues one when
// an OTP is confirmed); protected endpoints require it. Grants are
// stateless and HMAC-signed, so no storage is needed and they can't be
// forged without the secret.
class VerificationGrantService
{
    // How long a verification grant is valid after the phone is verified.
    private const GRANT_TTL_MS = 15 * 60 * 1000; // 15 minutes

    private string $secret;

    public function __construct()
    {
        $this->secret = (string) config('quickorder.verification_secret');
    }

    // Returns a signed token of the form "<base64url(payload)>.<hex signature>".
    public function issueGrant(string $phone, ?int $ttlMs = null): string
    {
        $ttlMs ??= self::GRANT_TTL_MS;
        $payload = json_encode([
            'phone' => PhoneNormalizer::normalize($phone),
            'exp' => self::nowMs() + $ttlMs,
        ]);
        $body = self::base64UrlEncode($payload);

        return "{$body}.{$this->sign($body)}";
    }

    // True only if the grant is well-formed, untampered, unexpired, and
    // bound to the same phone number being checked.
    public function verifyGrant(string $phone, ?string $grant): bool
    {
        if (! $grant) {
            return false;
        }
        $parts = explode('.', $grant);
        if (count($parts) !== 2) {
            return false;
        }
        [$body, $signature] = $parts;
        if ($body === '' || $signature === '') {
            return false;
        }
        if (! $this->signatureMatches($body, $signature)) {
            return false;
        }

        $payload = json_decode(self::base64UrlDecode($body), true);
        if (! is_array($payload) || ! isset($payload['exp'], $payload['phone'])) {
            return false;
        }
        if (! is_int($payload['exp']) || $payload['exp'] <= self::nowMs()) {
            return false;
        }

        return $payload['phone'] === PhoneNormalizer::normalize($phone);
    }

    private function sign(string $body): string
    {
        return hash_hmac('sha256', $body, $this->secret);
    }

    // Constant-time comparison to avoid leaking the signature via timing.
    private function signatureMatches(string $body, string $signature): bool
    {
        return hash_equals($this->sign($body), $signature);
    }

    private static function nowMs(): int
    {
        return (int) round(microtime(true) * 1000);
    }

    private static function base64UrlEncode(string $input): string
    {
        return rtrim(strtr(base64_encode($input), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $input): string
    {
        return (string) base64_decode(strtr($input, '-_', '+/'));
    }
}
