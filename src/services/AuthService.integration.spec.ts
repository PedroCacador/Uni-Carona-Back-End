import bcrypt from 'bcryptjs';
import { AuthService } from './AuthService';
import { IUsuarioRepository } from '../repositories/IUsuarioRepository';
import { IEmailService } from './IEmailService';
import { Usuario } from '../generated/prisma/client';
import { hashResetToken, generateResetToken } from '../utils/ResetTokenHelper';

jest.mock('jsonwebtoken');

describe('AuthService (integração com bcrypt real)', () => {
  let authService: AuthService;
  let usuarioRepositoryMock: jest.Mocked<IUsuarioRepository>;
  let emailServiceMock: jest.Mocked<IEmailService>;
  let storedUsuario: Usuario & { plainResetToken?: string };

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
      findByResetPasswordToken: jest.fn(async (tokenHash: string) => {
        if (
          storedUsuario.resetPasswordToken === tokenHash &&
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
      sendPasswordResetEmail: jest.fn(async (_to, rawToken) => {
        storedUsuario.plainResetToken = rawToken;
      }),
    };

    authService = new AuthService(usuarioRepositoryMock, emailServiceMock);
  });

  it('Deve permitir login com nova senha e bloquear senha antiga após redefinição', async () => {
    await authService.esqueciSenha({ email: 'joao@teste.com' });

    const rawToken = storedUsuario.plainResetToken!;
    expect(storedUsuario.resetPasswordToken).toBe(hashResetToken(rawToken));
    expect(storedUsuario.resetPasswordExpires).toBeInstanceOf(Date);

    await authService.redefinirSenha({ token: rawToken, novaSenha: 'nova_senha_123' });

    expect(storedUsuario.resetPasswordToken).toBeNull();
    expect(storedUsuario.resetPasswordExpires).toBeNull();
    expect(await bcrypt.compare('nova_senha_123', storedUsuario.senha)).toBe(true);
    expect(await bcrypt.compare('senha_antiga', storedUsuario.senha)).toBe(false);

    await expect(authService.login({ email: 'joao@teste.com', senha: 'senha_antiga' })).rejects.toThrow(
      'Credenciais inválidas.'
    );

    process.env.JWT_SECRET = 'test-secret';
    const jwt = require('jsonwebtoken');
    jwt.sign.mockReturnValueOnce('jwt-token');

    const login = await authService.login({ email: 'joao@teste.com', senha: 'nova_senha_123' });
    expect(login.token).toBe('jwt-token');
    expect(login.usuario).not.toHaveProperty('resetPasswordToken');
    expect(login.usuario).not.toHaveProperty('senha');
  });

  it('Deve impedir reutilização do token após redefinição', async () => {
    const { rawToken } = generateResetToken();
    storedUsuario.resetPasswordToken = hashResetToken(rawToken);
    storedUsuario.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await authService.redefinirSenha({ token: rawToken, novaSenha: '123456' });

    await expect(
      authService.redefinirSenha({ token: rawToken, novaSenha: 'outra123' })
    ).rejects.toThrow('Token inválido ou expirado.');
  });

  it('Deve rejeitar token expirado', async () => {
    const { rawToken, tokenHash } = generateResetToken();
    storedUsuario.resetPasswordToken = tokenHash;
    storedUsuario.resetPasswordExpires = new Date(Date.now() - 1000);

    await expect(
      authService.redefinirSenha({ token: rawToken, novaSenha: '123456' })
    ).rejects.toThrow('Token inválido ou expirado.');
  });
});
