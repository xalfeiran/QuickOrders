<?php

use App\Contracts\WhatsAppNotifier;
use App\Models\VerificationToken;
use App\Services\VerificationGrantService;
use App\Services\VerificationOtpService;
use Symfony\Component\HttpKernel\Exception\HttpException;

// Mirrors verification-otp.service.spec.ts from the old NestJS backend,
// case for case. Runs against the sqlite :memory: test database (see
// phpunit.xml) instead of the old test's fake in-memory repository, since
// VerificationOtpService here talks to Eloquent directly.

const PHONE = '+525512345678';

// A notifier stub that captures the code instead of logging it, mirroring
// the old test's FakeNotifier.
class CapturingNotifier implements WhatsAppNotifier
{
    public ?string $lastCode = null;

    public function sendVerificationCode(string $phone, string $code): void
    {
        $this->lastCode = $code;
    }
}

function buildOtpService(): array
{
    $notifier = new CapturingNotifier;
    app()->instance(WhatsAppNotifier::class, $notifier);
    $service = app(VerificationOtpService::class);

    return [$service, $notifier];
}

it('sends a 6-digit code and stores a token', function () {
    [$service, $notifier] = buildOtpService();
    $service->requestCode(PHONE);
    expect($notifier->lastCode)->toMatch('/^\d{6}$/');
    expect(VerificationToken::where('phone', PHONE)->exists())->toBeTrue();
});

it('confirms a correct code and returns a usable grant', function () {
    [$service, $notifier] = buildOtpService();
    $service->requestCode(PHONE);
    ['grant' => $grant] = $service->confirmCode(PHONE, $notifier->lastCode);
    expect((new VerificationGrantService)->verifyGrant(PHONE, $grant))->toBeTrue();
});

it('consumes the code (single use)', function () {
    [$service, $notifier] = buildOtpService();
    $service->requestCode(PHONE);
    $code = $notifier->lastCode;
    $service->confirmCode(PHONE, $code);
    expect(fn () => $service->confirmCode(PHONE, $code))->toThrow(HttpException::class);
});

it('rejects a second request within the cooldown', function () {
    [$service] = buildOtpService();
    $service->requestCode(PHONE);
    expect(fn () => $service->requestCode(PHONE))->toThrow(HttpException::class);
});

it('locks after too many wrong attempts', function () {
    [$service, $notifier] = buildOtpService();
    $service->requestCode(PHONE);
    $wrong = $notifier->lastCode === '000000' ? '111111' : '000000';
    for ($i = 0; $i < 5; $i++) {
        expect(fn () => $service->confirmCode(PHONE, $wrong))->toThrow(HttpException::class, 'Invalid code');
    }
    // 6th attempt is locked, even the correct code is refused.
    expect(fn () => $service->confirmCode(PHONE, $notifier->lastCode))
        ->toThrow(HttpException::class, 'Too many attempts');
});

it('rejects an expired code', function () {
    [$service, $notifier] = buildOtpService();
    $service->requestCode(PHONE);
    VerificationToken::where('phone', PHONE)->update(['expires_at' => now()->subSecond()]);
    expect(fn () => $service->confirmCode(PHONE, $notifier->lastCode))
        ->toThrow(HttpException::class, 'expired');
});
