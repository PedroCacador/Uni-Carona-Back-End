import bcrypt from 'bcryptjs';
import { AuthService } from './AuthService';
import { IUsuarioRepository } from '../repositories/IUsuarioRepository';
import { IEmailService } from './IEmailService';
import { Usuario } from '../generated/prisma/client';
import { hashResetCode, generateResetCode } from '../utils/ResetTokenHelper';

jest.mock('jsonwebtoken');

describe('AuthService (integração com bcrypt real)', () => {
  let authService: AuthService;
  let usuarioRepositoryMock: jest.Mocked<IUsuarioRepository>;
  let emailServiceMock: jest.Mocked<IEmailService>;
  let storedUsuario: Usuario & { plainResetCode?: string };

  const mockDate = new Date('2000-01-01T00:00:00.000Z');

  const baseUsuario: Usuario = {
    id: 'user-1',
    nome: 'João',
    email: 'joao@teste.com',
    cpf: '11144477735',
    matricula: null,
    curso: 'Engenharia',
    senha: '',
    dataNascimento: mockDate,
    status: 'ATIVO',
    role: 'USER',
    resetPasswordToken: null,
    resetPasswordExpires: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const senhaHash = await bcrypt.hash('senha_antiga', 10);
    storedUsuario = { ...baseUsuario, senha: senhaHash };

    usuarioRepositoryMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(async (email: string) =>
        email === storedUsuario.email ? storedUsuario : null
      ),
      findByResetPasswordToken: jest.fn(async (codeHash: string) => {
        if (
          storedUsuario.resetPasswordToken === codeHash &&
          storedUsuario.resetPasswordExpires &&
          storedUsuario.resetPasswordExpires > new Date()
        ) {
          return storedUsuario;
        }
        return null;
      }),
      update: jest.fn(async (data) => {
        storedUsuario = { ...storedUsuario, ...data };
        return storedUsuario;
      }),
    };

    emailServiceMock = {
      sendPasswordResetEmail: jest.fn(async (_to, rawCode) => {
        storedUsuario.plainResetCode = rawCode;
      }),
    };

    authService = new AuthService(usuarioRepositoryMock, emailServiceMock);
  });

  it('Deve executar fluxo completo com código de 6 dígitos', async () => {
    await authService.esqueciSenha({ email: '  Joao@Teste.com  ' });

    const rawCode = storedUsuario.plainResetCode!;
    expect(rawCode).toMatch(/^\d{6}$/);
    expect(storedUsuario.resetPasswordToken).toBe(hashResetCode(rawCode));
    expect(storedUsuario.resetPasswordExpires).toBeInstanceOf(Date);

    await expect(authService.validarCodigo({ codigo: rawCode })).resolves.toEqual({ valid: true });

    await authService.redefinirSenha({ codigo: rawCode, novaSenha: 'nova_senha_123' });

    expect(storedUsuario.resetPasswordToken).toBeNull();
    expect(storedUsuario.resetPasswordExpires).toBeNull();
    expect(await bcrypt.compare('nova_senha_123', storedUsuario.senha)).toBe(true);
    expect(await bcrypt.compare('senha_antiga', storedUsuario.senha)).toBe(false);

    process.env.JWT_SECRET = 'test-secret';
    const jwt = require('jsonwebtoken');
    jwt.sign.mockReturnValueOnce('jwt-token');

    const login = await authService.login({ email: 'joao@teste.com', senha: 'nova_senha_123' });
    expect(login.token).toBe('jwt-token');
  });

  it('Deve impedir reutilização do código após redefinição', async () => {
    const { rawCode } = generateResetCode();
    storedUsuario.resetPasswordToken = hashResetCode(rawCode);
    storedUsuario.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await authService.redefinirSenha({ codigo: rawCode, novaSenha: '123456' });

    await expect(
      authService.redefinirSenha({ codigo: rawCode, novaSenha: 'outra123' })
    ).rejects.toThrow('Código inválido ou expirado.');
  });

  it('Deve rejeitar código expirado', async () => {
    const { rawCode, codeHash } = generateResetCode();
    storedUsuario.resetPasswordToken = codeHash;
    storedUsuario.resetPasswordExpires = new Date(Date.now() - 1000);

    await expect(
      authService.redefinirSenha({ codigo: rawCode, novaSenha: '123456' })
    ).rejects.toThrow('Código inválido ou expirado.');
  });
});
