import { VerificationGrantService } from './verification-grant.service';
import { VerificationOtpService } from './verification-otp.service';

// Minimal in-memory stand-in for the TypeORM repository (keyed by phone).
class FakeTokenRepo {
  store = new Map<string, any>();
  private seq = 0;

  async findOne({ where: { phone } }: any) {
    return this.store.get(phone) ?? null;
  }
  create(obj: any) {
    return { ...obj };
  }
  async save(token: any) {
    if (!token.id) token.id = `id-${++this.seq}`;
    this.store.set(token.phone, token);
    return token;
  }
  async delete(criteria: any) {
    for (const [phone, token] of this.store) {
      const matches = Object.entries(criteria).every(
        ([k, v]) => token[k] === v,
      );
      if (matches) this.store.delete(phone);
    }
  }
}

class FakeNotifier {
  lastCode: string | null = null;
  async sendVerificationCode(_phone: string, code: string) {
    this.lastCode = code;
  }
}

const PHONE = '+525512345678';

function build() {
  const repo = new FakeTokenRepo();
  const notifier = new FakeNotifier();
  const service = new VerificationOtpService(
    repo as any,
    new VerificationGrantService(),
    notifier as any,
  );
  return { service, repo, notifier };
}

describe('VerificationOtpService', () => {
  it('sends a 6-digit code and stores a token', async () => {
    const { service, repo, notifier } = build();
    await service.requestCode(PHONE);
    expect(notifier.lastCode).toMatch(/^\d{6}$/);
    expect(repo.store.get(PHONE)).toBeDefined();
  });

  it('confirms a correct code and returns a usable grant', async () => {
    const { service, notifier } = build();
    await service.requestCode(PHONE);
    const { grant } = await service.confirmCode(PHONE, notifier.lastCode!);
    expect(new VerificationGrantService().verifyGrant(PHONE, grant)).toBe(true);
  });

  it('consumes the code (single use)', async () => {
    const { service, notifier } = build();
    await service.requestCode(PHONE);
    const code = notifier.lastCode!;
    await service.confirmCode(PHONE, code);
    await expect(service.confirmCode(PHONE, code)).rejects.toThrow();
  });

  it('rejects a second request within the cooldown', async () => {
    const { service } = build();
    await service.requestCode(PHONE);
    await expect(service.requestCode(PHONE)).rejects.toThrow();
  });

  it('locks after too many wrong attempts', async () => {
    const { service, notifier } = build();
    await service.requestCode(PHONE);
    const wrong = notifier.lastCode === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) {
      await expect(service.confirmCode(PHONE, wrong)).rejects.toThrow(
        'Invalid code',
      );
    }
    // 6th attempt is locked, even the correct code is refused.
    await expect(service.confirmCode(PHONE, notifier.lastCode!)).rejects.toThrow(
      'Too many attempts',
    );
  });

  it('rejects an expired code', async () => {
    const { service, repo, notifier } = build();
    await service.requestCode(PHONE);
    repo.store.get(PHONE).expiresAt = new Date(Date.now() - 1000);
    await expect(service.confirmCode(PHONE, notifier.lastCode!)).rejects.toThrow(
      'expired',
    );
  });
});
