import { sanitizeUsuario } from './UsuarioSanitizer';
import { Usuario } from '../generated/prisma/client';

describe('UsuarioSanitizer', () => {
  const usuario: Usuario = {
    id: '1',
    nome: 'Teste',
    senha: 'hash',
    email: 'teste@email.com',
    cpf: '11144477735',
    matricula: null,
    curso: 'Curso',
    status: 'ATIVO',
    dataNascimento: new Date(),
    role: 'USER',
    resetPasswordToken: 'token_hash',
    resetPasswordExpires: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('Deve remover senha e campos de recuperação de senha', () => {
    const safe = sanitizeUsuario(usuario);

    expect(safe).not.toHaveProperty('senha');
    expect(safe).not.toHaveProperty('resetPasswordToken');
    expect(safe).not.toHaveProperty('resetPasswordExpires');
    expect(safe.email).toBe(usuario.email);
  });
});
