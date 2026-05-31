import {
  generateResetCode,
  hashResetCode,
  isValidResetCodeFormat,
  normalizeResetCode,
} from './ResetTokenHelper';

describe('ResetTokenHelper', () => {
  describe('generateResetCode', () => {
    it('Deve gerar código com exatamente 6 dígitos numéricos', () => {
      const { rawCode, codeHash } = generateResetCode();

      expect(rawCode).toMatch(/^\d{6}$/);
      expect(codeHash).toBe(hashResetCode(rawCode));
    });

    it('Deve gerar códigos diferentes em chamadas distintas', () => {
      const first = generateResetCode().rawCode;
      const second = generateResetCode().rawCode;

      expect(first).toMatch(/^\d{6}$/);
      expect(second).toMatch(/^\d{6}$/);
    });
  });

  describe('isValidResetCodeFormat', () => {
    it('Deve aceitar códigos com 6 dígitos', () => {
      expect(isValidResetCodeFormat('123456')).toBe(true);
      expect(isValidResetCodeFormat('000381')).toBe(true);
      expect(isValidResetCodeFormat(' 847291 ')).toBe(true);
    });

    it('Deve rejeitar formatos inválidos', () => {
      expect(isValidResetCodeFormat('12345')).toBe(false);
      expect(isValidResetCodeFormat('1234567')).toBe(false);
      expect(isValidResetCodeFormat('12a456')).toBe(false);
      expect(isValidResetCodeFormat('abc123')).toBe(false);
      expect(isValidResetCodeFormat('')).toBe(false);
    });
  });

  describe('hashResetCode', () => {
    it('Deve aplicar trim ao hashear', () => {
      expect(hashResetCode(' 123456 ')).toBe(hashResetCode('123456'));
      expect(normalizeResetCode(' 123456 ')).toBe('123456');
    });
  });
});
