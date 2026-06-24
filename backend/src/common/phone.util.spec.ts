import { normalizePhone } from './phone.util';

describe('normalizePhone', () => {
  it('strips spaces, dashes and parentheses', () => {
    expect(normalizePhone('+52 (55) 1234-5678')).toBe('+525512345678');
  });

  it('keeps a leading +', () => {
    expect(normalizePhone('+525512345678')).toBe('+525512345678');
  });

  it('does not invent a + when absent', () => {
    expect(normalizePhone('5512345678')).toBe('5512345678');
  });

  it('treats differently-spaced versions of the same number as equal', () => {
    expect(normalizePhone('+52 55 1234 5678')).toBe(
      normalizePhone('+525512345678'),
    );
  });

  it('handles empty / nullish input', () => {
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone(undefined as unknown as string)).toBe('');
  });
});
