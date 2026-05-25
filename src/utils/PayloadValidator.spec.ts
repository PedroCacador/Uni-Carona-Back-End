import { assertStringField } from './PayloadValidator';

describe('PayloadValidator', () => {
  it('Deve aceitar string válida', () => {
    expect(assertStringField('valor', 'Campo')).toBe('valor');
  });

  it('Deve rejeitar tipos não string', () => {
    expect(() => assertStringField(123, 'Campo')).toThrow('Campo inválido.');
    expect(() => assertStringField(null, 'Campo')).toThrow('Campo inválido.');
    expect(() => assertStringField({ email: 'a@b.com' }, 'E-mail')).toThrow('E-mail inválido.');
  });
});
