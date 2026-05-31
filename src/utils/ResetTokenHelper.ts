import crypto from 'crypto';

const RESET_CODE_LENGTH = 6;
const RESET_CODE_MAX_EXCLUSIVE = 1_000_000;

export function generateResetCode(): { rawCode: string; codeHash: string } {
  const numericValue = crypto.randomInt(0, RESET_CODE_MAX_EXCLUSIVE);
  const rawCode = String(numericValue).padStart(RESET_CODE_LENGTH, '0');
  const codeHash = hashResetCode(rawCode);
  return { rawCode, codeHash };
}

/** @deprecated Use generateResetCode — mantido para compatibilidade interna de testes legados */
export const generateResetToken = generateResetCode;

export function isValidResetCodeFormat(code: string): boolean {
  if (typeof code !== 'string') return false;
  return /^\d{6}$/.test(code.trim());
}

export function normalizeResetCode(code: string): string {
  return code.trim();
}

export function hashResetCode(code: string): string {
  const normalized = normalizeResetCode(code);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/** @deprecated Use hashResetCode */
export const hashResetToken = hashResetCode;
