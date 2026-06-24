import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { normalizePhone } from '../common/phone.util';

// How long a verification grant is valid after the phone is verified.
const GRANT_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Issues and verifies short-lived, phone-bound "grants". A grant is proof that
// a phone number was verified (Phase 5 issues one when an OTP is confirmed);
// protected endpoints require it. Grants are stateless and HMAC-signed, so no
// storage is needed and they can't be forged without the secret.
@Injectable()
export class VerificationGrantService {
  private readonly secret =
    process.env.VERIFICATION_SECRET ?? 'dev-insecure-secret-change-me';

  // Returns a signed token of the form `<base64url(payload)>.<hex signature>`.
  issueGrant(phone: string, ttlMs: number = GRANT_TTL_MS): string {
    const payload = {
      phone: normalizePhone(phone),
      exp: Date.now() + ttlMs,
    };
    const body = base64UrlEncode(JSON.stringify(payload));
    return `${body}.${this.sign(body)}`;
  }

  // True only if the grant is well-formed, untampered, unexpired, and bound to
  // the same phone number being checked.
  verifyGrant(phone: string, grant: string | undefined): boolean {
    if (!grant) return false;
    const [body, signature] = grant.split('.');
    if (!body || !signature) return false;
    if (!this.signatureMatches(body, signature)) return false;

    try {
      const payload = JSON.parse(base64UrlDecode(body));
      if (typeof payload.exp !== 'number' || payload.exp <= Date.now()) {
        return false;
      }
      return payload.phone === normalizePhone(phone);
    } catch {
      return false;
    }
  }

  private sign(body: string): string {
    return createHmac('sha256', this.secret).update(body).digest('hex');
  }

  // Constant-time comparison to avoid leaking the signature via timing.
  private signatureMatches(body: string, signature: string): boolean {
    const expected = Buffer.from(this.sign(body), 'hex');
    const actual = Buffer.from(signature, 'hex');
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}
