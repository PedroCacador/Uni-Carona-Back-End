const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  const normalized = email.trim();
  if (normalized.length === 0 || normalized.length > 254) return false;
  return EMAIL_REGEX.test(normalized);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
