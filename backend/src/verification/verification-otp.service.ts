import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { normalizePhone } from '../common/phone.util';
import { VerificationGrantService } from './verification-grant.service';
import { VerificationToken } from './verification-token.entity';
import { WhatsAppNotifier } from './whatsapp-notifier';

const CODE_TTL_MS = 5 * 60 * 1000; // code valid for 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // min gap between code requests
const MAX_ATTEMPTS = 5; // failed confirms before the code locks

@Injectable()
export class VerificationOtpService {
  private readonly secret =
    process.env.VERIFICATION_SECRET ?? 'dev-insecure-secret-change-me';

  constructor(
    @InjectRepository(VerificationToken)
    private readonly tokens: Repository<VerificationToken>,
    private readonly grants: VerificationGrantService,
    private readonly whatsapp: WhatsAppNotifier,
  ) {}

  // Generates a 6-digit code, stores its hash, and "sends" it over WhatsApp.
  async requestCode(rawPhone: string): Promise<{ expiresInSeconds: number }> {
    const phone = normalizePhone(rawPhone);
    const existing = await this.tokens.findOne({ where: { phone } });

    if (
      existing &&
      Date.now() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      throw new HttpException(
        'Please wait before requesting another code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const now = new Date();

    const token = existing ?? this.tokens.create({ phone });
    token.codeHash = this.hash(phone, code);
    token.attempts = 0;
    token.expiresAt = new Date(now.getTime() + CODE_TTL_MS);
    token.lastSentAt = now;
    await this.tokens.save(token);

    await this.whatsapp.sendVerificationCode(phone, code);
    return { expiresInSeconds: Math.floor(CODE_TTL_MS / 1000) };
  }

  // Confirms a code. On success deletes the token and returns a verification
  // grant the client uses for address lookup and order placement.
  async confirmCode(
    rawPhone: string,
    code: string,
  ): Promise<{ grant: string }> {
    const phone = normalizePhone(rawPhone);
    const token = await this.tokens.findOne({ where: { phone } });

    if (!token || token.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Code expired or not requested');
    }
    if (token.attempts >= MAX_ATTEMPTS) {
      throw new HttpException(
        'Too many attempts, request a new code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!this.codeMatches(phone, code, token.codeHash)) {
      token.attempts += 1;
      await this.tokens.save(token);
      throw new UnauthorizedException('Invalid code');
    }

    // Single-use: consume the token so the code can't be replayed.
    await this.tokens.delete({ id: token.id });
    return { grant: this.grants.issueGrant(phone) };
  }

  private hash(phone: string, code: string): string {
    return createHmac('sha256', this.secret)
      .update(`${phone}:${code}`)
      .digest('hex');
  }

  private codeMatches(phone: string, code: string, expectedHash: string): boolean {
    const actual = Buffer.from(this.hash(phone, code), 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }
}
