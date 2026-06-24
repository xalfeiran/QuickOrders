// Normalises phone numbers to a consistent form so the same number always
// keys to the same customer and matches a verification grant. Keeps a leading
// "+" (country code) if present and strips everything that isn't a digit.
export function normalizePhone(raw: string): string {
  const trimmed = (raw ?? '').trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}
