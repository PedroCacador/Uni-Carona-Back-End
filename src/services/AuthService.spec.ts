import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  AuthService,
  ESQUECI_SENHA_SUCCESS_MESSAGE,
  REDEFINIR_SENHA_SUCCESS_MESSAGE,
  CODIGO_INVALIDO_MESSAGE,
} from './AuthService';
import { IUsuarioRepository } from '../repositories/IUsuarioRepository';
import { IEmailService } from './IEmailService';
import { Usuario } from '../generated/prisma/client';
import { hashResetToken } from '../utils/ResetTokenHelper';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let usuarioRepositoryMock: jest.Mocked<IUsuarioRepository>;
  let emailServiceMock: jest.Mocked<IEmailService>;

  const mockDate = new Date('2000-01-01T00:00:00.000Z');

  const mockUsuario: Usuario = {
    id: 'user-1',
    nome: 'João da Silva',
    email: 'joao@teste.com',
    cpf: '12345678900',
    matricula: null,
    curso: 'Engenharia',
    senha: 'hash_senha123',
    dataNascimento: mockDate,
    status: 'ATIVO',
    role: 'USER',
    resetPasswordToken: null,
    resetPasswordExpires: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';

    usuarioRepositoryMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByResetPasswordToken: jest.fn(),
      update: jest.fn(),
    };

    emailServiceMock = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    authService = new AuthService(usuarioRepositoryMock, emailServiceMock);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('Deve lançar erro se credenciais forem inválidas', async () => {
      usuarioRepositoryMock.findByEmail.mockResolvedValueOnce(null);

      await expect(
        authService.login({ email: 'joao@teste.com', senha: 'senha123' })
      ).rejects.toThrow('Credenciais inválidas.');
    });

    it('Deve retornar token e usuário sem senha quando credenciais forem válidas', async () => {
      usuarioRepositoryMock.findByEmail.mockResolvedValueOnce(mockUsuario);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      (jwt.sign as jest.Mock).mockReturnValueOnce('jwt-token');

      const result = await authService.login({ email: '  Joao@Teste.com  ', senha: 'senha123' });

      expect(usuarioRepositoryMock.findByEmail).toHaveBeenCalledWith('joao@teste.com');
      expect(result.token).toBe('jwt-token');
      expect(result.usuario).not.toHaveProperty('senha');
      expect(result.usuario).not.toHaveProperty('resetPasswordToken');
      expect(result.usuario).not.toHaveProperty('resetPasswordExpires');
      expect(result.usuario.email).toBe(mockUsuario.email);
    });
  });

  describe('esqueciSenha', () => {
    it('Deve lançar erro se o e-mail for vazio', async () => {
      await expect(authService.esqueciSenha({ email: '' })).rejects.toThrow('E-mail é obrigatório.');
      await expect(authService.esqueciSenha({ email: '   ' })).rejects.toThrow('E-mail é obrigatório.');
    });

    it('Deve lançar erro se o formato do e-mail for inválido', async () => {
      await expect(authService.esqueciSenha({ email: 'email-invalido' })).rejects.toThrow('E-mail inválido.');
    });

    it('Deve lançar erro se o e-mail não for string', async () => {
      await expect(authService.esqueciSenha({ email: 123 as unknown as string })).rejects.toThrow(
        'E-mail é obrigatório.'
      );
    });

    it('Deve retornar mensagem genérica para tentativa de SQL injection sem vazar dados', async () => {
      usuarioRepositoryMock.findByEmail.mockResolvedValueOnce(null);

      const result = await authService.esqueciSenha({
        email: "admin'--@teste.com",
      });

      expect(result.message).toBe(ESQUECI_SENHA_SUCCESS_MESSAGE);
      expect(result).not.toHaveProperty('token');
    });

    it('Deve retornar mensagem genérica mesmo quando o e-mail não existir', async () => {
      usuarioRepositoryMock.findByEmail.mockResolvedValueOnce(null);

      const result = await authService.esqueciSenha({ email: 'inexistente@teste.com' });

      expect(result.message).toBe(ESQUECI_SENHA_SUCCESS_MESSAGE);
      expect(usuarioRepositoryMock.update).not.toHaveBeenCalled();
      expect(emailServiceMock.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('Deve retornar mensagem genérica quando o usuário estiver inativo', async () => {
      usuarioRepositoryMock.findByEmail.mockResolvedValueOnce({ ...mockUsuario, status: 'INATIVO' });

      const result = await authService.esqueciSenha({ email: 'joao@teste.com' });

      expect(result.message).toBe(ESQUECI_SENHA_SUCCESS_MESSAGE);
      expect(usuarioRepositoryMock.update).not.toHaveBeenCalled();
      expect(emailServiceMock.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('Deve gerar token, salvar no banco e enviar e-mail para usuário ativo', async () => {
      usuarioRepositoryMock.findByEmail.mockResolvedValueOnce(mockUsuario);
      usuarioRepositoryMock.update.mockResolvedValueOnce(mockUsuario);

      const result = await authService.esqueciSenha({ email: '  Joao@Teste.com  ' });

      expect(result.message).toBe(ESQUECI_SENHA_SUCCESS_MESSAGE);
      expect(usuarioRepositoryMock.findByEmail).toHaveBeenCalledWith('joao@teste.com');
      expect(usuarioRepositoryMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUsuario.id,
          resetPasswordToken: expect.any(String),
          resetPasswordExpires: expect.any(Date),
        })
      );
      expect(emailServiceMock.sendPasswordResetEmail).toHaveBeenCalledWith(
        'joao@teste.com',
        expect.any(String)
      );
    });
  });

  describe('validarCodigo', () => {
    const rawToken = 'abc123token';
    const tokenHash = hashResetToken(rawToken);

    const usuarioComToken: Usuario = {
      ...mockUsuario,
      resetPasswordToken: tokenHash,
      resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
    };

    it('Deve lançar erro se o código for vazio', async () => {
      await expect(authService.validarCodigo({ codigo: '' })).rejects.toThrow('Código é obrigatório.');
      await expect(authService.validarCodigo({ codigo: '   ' })).rejects.toThrow('Código é obrigatório.');
    });

    it('Deve lançar erro se o código não for string', async () => {
      await expect(
        authService.validarCodigo({ codigo: 123 as unknown as string })
      ).rejects.toThrow('Código é obrigatório.');
    });

    it('Deve lançar erro se o código for inválido ou expirado', async () => {
      usuarioRepositoryMock.findByResetPasswordToken.mockResolvedValueOnce(null);

      await expect(authService.validarCodigo({ codigo: rawToken })).rejects.toThrow(CODIGO_INVALIDO_MESSAGE);
      expect(usuarioRepositoryMock.findByResetPasswordToken).toHaveBeenCalledWith(tokenHash);
    });

    it('Deve lançar erro se o código não pertencer ao e-mail informado', async () => {
      usuarioRepositoryMock.findByResetPasswordToken.mockResolvedValueOnce(usuarioComToken);

      await expect(
        authService.validarCodigo({ email: 'outro@teste.com', codigo: rawToken })
      ).rejects.toThrow(CODIGO_INVALIDO_MESSAGE);
    });

    it('Deve validar com sucesso SEM consumir o token (sem update)', async () => {
      usuarioRepositoryMock.findByResetPasswordToken.mockResolvedValueOnce(usuarioComToken);

      const result = await authService.validarCodigo({ email: '  Joao@Teste.com  ', codigo: rawToken });

      expect(result).toEqual({ valid: true });
      expect(usuarioRepositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe('redefinirSenha', () => {
    const rawToken = 'abc123token';
    const tokenHash = hashResetToken(rawToken);

    it('Deve lançar erro se o token for vazio', async () => {
      await expect(
        authService.redefinirSenha({ token: '', novaSenha: '123456' })
      ).rejects.toThrow('Token é obrigatório.');
    });

    it('Deve lançar erro se a nova senha for vazia', async () => {
      await expect(
        authService.redefinirSenha({ token: rawToken, novaSenha: '' })
      ).rejects.toThrow('Nova senha é obrigatória.');
    });

    it('Deve lançar erro se a senha não atender ao mínimo', async () => {
      await expect(
        authService.redefinirSenha({ token: rawToken, novaSenha: '123' })
      ).rejects.toThrow('A senha deve ter no mínimo 6 caracteres.');
    });

    it('Deve lançar erro se o token for inválido ou expirado', async () => {
      usuarioRepositoryMock.findByResetPasswordToken.mockResolvedValueOnce(null);

      await expect(
        authService.redefinirSenha({ token: rawToken, novaSenha: '123456' })
      ).rejects.toThrow('Token inválido ou expirado.');

      expect(usuarioRepositoryMock.findByResetPasswordToken).toHaveBeenCalledWith(tokenHash);
    });

    it('Deve lançar erro se token ou senha não forem string', async () => {
      await expect(
        authService.redefinirSenha({ token: 123 as unknown as string, novaSenha: '123456' })
      ).rejects.toThrow('Token é obrigatório.');

      await expect(
        authService.redefinirSenha({ token: rawToken, novaSenha: 123456 as unknown as string })
      ).rejects.toThrow('Nova senha é obrigatória.');
    });

    it('Deve impedir reutilização do token após redefinição bem-sucedida', async () => {
      usuarioRepositoryMock.findByResetPasswordToken
        .mockResolvedValueOnce({
          ...mockUsuario,
          resetPasswordToken: tokenHash,
          resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
        })
        .mockResolvedValueOnce(null);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('nova_senha_hash');
      usuarioRepositoryMock.update.mockResolvedValueOnce(mockUsuario);

      await authService.redefinirSenha({ token: rawToken, novaSenha: '123456' });

      await expect(
        authService.redefinirSenha({ token: rawToken, novaSenha: '654321' })
      ).rejects.toThrow('Token inválido ou expirado.');
    });

    it('Deve redefinir senha, invalidar token e retornar mensagem de sucesso', async () => {
      usuarioRepositoryMock.findByResetPasswordToken.mockResolvedValueOnce({
        ...mockUsuario,
        resetPasswordToken: tokenHash,
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
      });
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('nova_senha_hash');
      usuarioRepositoryMock.update.mockResolvedValueOnce(mockUsuario);

      const result = await authService.redefinirSenha({ token: rawToken, novaSenha: '123456' });

      expect(result.message).toBe(REDEFINIR_SENHA_SUCCESS_MESSAGE);
      expect(usuarioRepositoryMock.update).toHaveBeenCalledWith({
        id: mockUsuario.id,
        senha: 'nova_senha_hash',
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });
    });
  });
});
