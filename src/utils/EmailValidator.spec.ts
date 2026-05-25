import { isValidEmail, normalizeEmail } from './EmailValidator';

describe('EmailValidator', () => {
  describe('isValidEmail', () => {
    it('Deve retornar true para e-mails válidos', () => {
      expect(isValidEmail('usuario@email.com')).toBe(true);
      expect(isValidEmail('  usuario@email.com  ')).toBe(true);
    });

    it('Deve retornar false para e-mails inválidos', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('email-invalido')).toBe(false);
      expect(isValidEmail('usuario@')).toBe(false);
    });
  });

  describe('normalizeEmail', () => {
    it('Deve normalizar e-mail com trim e lowercase', () => {
      expect(normalizeEmail('  Usuario@Email.COM  ')).toBe('usuario@email.com');
    });
  });
});
