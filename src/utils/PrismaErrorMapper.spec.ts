import {
  getPrismaUniqueField,
  isPrismaUniqueConstraintError,
  mapPrismaCreateError,
  mapPrismaUniqueConstraintError,
} from './PrismaErrorMapper';

describe('PrismaErrorMapper', () => {
  it('Deve identificar erro P2002', () => {
    expect(isPrismaUniqueConstraintError({ code: 'P2002' })).toBe(true);
    expect(isPrismaUniqueConstraintError(new Error('outro'))).toBe(false);
  });

  it('Deve extrair campo único do meta.target', () => {
    expect(getPrismaUniqueField({ meta: { target: ['cpf'] } })).toBe('cpf');
    expect(getPrismaUniqueField({ meta: { target: 'email' } })).toBe('email');
  });

  it('Deve mapear CPF e e-mail duplicados', () => {
    expect(mapPrismaUniqueConstraintError({ code: 'P2002', meta: { target: ['cpf'] } }).message).toBe(
      'CPF já está em uso.'
    );
    expect(mapPrismaUniqueConstraintError({ code: 'P2002', meta: { target: ['email'] } }).message).toBe(
      'E-mail já está em uso.'
    );
  });

  it('Deve encapsular erro desconhecido no cadastro', () => {
    expect(mapPrismaCreateError({ code: 'P2002', meta: { target: ['placa'] } }).message).toBe(
      'Registro já cadastrado.'
    );
    expect(mapPrismaCreateError(new Error('falha interna')).message).toBe('falha interna');
  });
});
