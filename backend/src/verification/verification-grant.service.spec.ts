import { VerificationGrantService } from './verification-grant.service';

describe('VerificationGrantService', () => {
  const grants = new VerificationGrantService();

  it('accepts a freshly issued grant for the same number', () => {
    const grant = grants.issueGrant('+52 55 1234 5678');
    expect(grants.verifyGrant('+525512345678', grant)).toBe(true);
  });

  it('matches regardless of phone formatting', () => {
    const grant = grants.issueGrant('+525512345678');
    expect(grants.verifyGrant('+52 55 1234 5678', grant)).toBe(true);
  });

  it('rejects a grant for a different number', () => {
    const grant = grants.issueGrant('+525512345678');
    expect(grants.verifyGrant('+525500000000', grant)).toBe(false);
  });

  it('rejects a missing grant', () => {
    expect(grants.verifyGrant('+525512345678', undefined)).toBe(false);
  });

  it('rejects a tampered signature', () => {
    const grant = grants.issueGrant('+525512345678');
    const [body] = grant.split('.');
    expect(grants.verifyGrant('+525512345678', `${body}.deadbeef`)).toBe(false);
  });

  it('rejects an expired grant', () => {
    const grant = grants.issueGrant('+525512345678', -1000);
    expect(grants.verifyGrant('+525512345678', grant)).toBe(false);
  });

  it('rejects a forged payload (signature will not match)', () => {
    const valid = grants.issueGrant('+525512345678');
    const forgedBody = Buffer.from(
      JSON.stringify({ phone: '+525500000000', exp: Date.now() + 99999 }),
      'utf8',
    ).toString('base64url');
    const forged = `${forgedBody}.${valid.split('.')[1]}`;
    expect(grants.verifyGrant('+525500000000', forged)).toBe(false);
  });
});
