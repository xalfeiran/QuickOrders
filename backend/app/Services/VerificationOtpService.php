<?php

namespace App\Services;

use App\Contracts\WhatsAppNotifier;
use App\Models\VerificationToken;
use App\Support\PhoneNormalizer;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class VerificationOtpService
{
    private const CODE_TTL_SECONDS = 5 * 60; // code valid for 5 minutes

    private const RESEND_COOLDOWN_SECONDS = 30; // min gap between code requests

    private const MAX_ATTEMPTS = 5; // failed confirms before the code locks

    private string $secret;

    public function __construct(
        private readonly VerificationGrantService $grants,
        private readonly WhatsAppNotifier $whatsapp,
    ) {
        $this->secret = (string) config('quickorder.verification_secret');
    }

    // Generates a 6-digit code, stores its hash, and "sends" it over WhatsApp.
    public function requestCode(string $rawPhone): array
    {
        $phone = PhoneNormalizer::normalize($rawPhone);
        $existing = VerificationToken::where('phone', $phone)->first();

        if ($existing && $existing->last_sent_at->diffInSeconds(now(), true) < self::RESEND_COOLDOWN_SECONDS) {
            throw new TooManyRequestsHttpException(null, 'Please wait before requesting another code');
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $now = now();

        $token = $existing ?? new VerificationToken(['phone' => $phone]);
        $token->code_hash = $this->hash($phone, $code);
        $token->attempts = 0;
        $token->expires_at = $now->clone()->addSeconds(self::CODE_TTL_SECONDS);
        $token->last_sent_at = $now;
        $token->save();

        $this->whatsapp->sendVerificationCode($phone, $code);

        return ['expiresInSeconds' => self::CODE_TTL_SECONDS];
    }

    // Confirms a code. On success deletes the token and returns a
    // verification grant the client uses for address lookup and order
    // placement.
    public function confirmCode(string $rawPhone, string $code): array
    {
        $phone = PhoneNormalizer::normalize($rawPhone);
        $token = VerificationToken::where('phone', $phone)->first();

        if (! $token || $token->expires_at->isPast()) {
            throw new BadRequestHttpException('Code expired or not requested');
        }
        if ($token->attempts >= self::MAX_ATTEMPTS) {
            throw new TooManyRequestsHttpException(null, 'Too many attempts, request a new code');
        }

        if (! $this->codeMatches($phone, $code, $token->code_hash)) {
            $token->increment('attempts');
            throw new UnauthorizedHttpException('', 'Invalid code');
        }

        // Single-use: consume the token so the code can't be replayed.
        $token->delete();

        return ['grant' => $this->grants->issueGrant($phone)];
    }

    private function hash(string $phone, string $code): string
    {
        return hash_hmac('sha256', "{$phone}:{$code}", $this->secret);
    }

    private function codeMatches(string $phone, string $code, string $expectedHash): bool
    {
        return hash_equals($expectedHash, $this->hash($phone, $code));
    }
}
