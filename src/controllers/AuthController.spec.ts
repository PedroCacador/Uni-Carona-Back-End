import express from 'express';
import request from 'supertest';
import { AuthController } from './AuthController';
import { AuthService, ESQUECI_SENHA_SUCCESS_MESSAGE, REDEFINIR_SENHA_SUCCESS_MESSAGE } from '../services/AuthService';

describe('AuthController (integração HTTP)', () => {
  let authServiceMock: jest.Mocked<AuthService>;
  let app: express.Application;

  beforeEach(() => {
    authServiceMock = {
      login: jest.fn(),
      esqueciSenha: jest.fn(),
      validarCodigo: jest.fn(),
      redefinirSenha: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    const controller = new AuthController(authServiceMock);
    app = express();
    app.use(express.json());
    app.post('/auth/esqueci-senha', controller.esqueciSenha.bind(controller));
    app.post('/auth/validar-codigo', controller.validarCodigo.bind(controller));
    app.post('/auth/redefinir-senha', controller.redefinirSenha.bind(controller));
  });

  describe('POST /auth/esqueci-senha', () => {
    it('Deve retornar 200 com mensagem genérica', async () => {
      authServiceMock.esqueciSenha.mockResolvedValueOnce({ message: ESQUECI_SENHA_SUCCESS_MESSAGE });

      const response = await request(app)
        .post('/auth/esqueci-senha')
        .send({ email: 'usuario@email.com' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: ESQUECI_SENHA_SUCCESS_MESSAGE });
      expect(response.body).not.toHaveProperty('token');
    });

    it('Deve retornar 400 para e-mail com tipo inválido', async () => {
      const response = await request(app)
        .post('/auth/esqueci-senha')
        .send({ email: { malicious: true } });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('E-mail inválido.');
      expect(authServiceMock.esqueciSenha).not.toHaveBeenCalled();
    });

    it('Deve repassar payload com tentativa de SQL injection ao service', async () => {
      authServiceMock.esqueciSenha.mockResolvedValueOnce({ message: ESQUECI_SENHA_SUCCESS_MESSAGE });

      const sqlPayload = "' OR 1=1; DROP TABLE Usuario; --";
      const response = await request(app)
        .post('/auth/esqueci-senha')
        .send({ email: sqlPayload });

      expect(response.status).toBe(200);
      expect(authServiceMock.esqueciSenha).toHaveBeenCalledWith({ email: sqlPayload });
    });
  });

  describe('POST /auth/validar-codigo', () => {
    it('Deve retornar 200 quando o código for válido', async () => {
      authServiceMock.validarCodigo.mockResolvedValueOnce({ valid: true });

      const response = await request(app)
        .post('/auth/validar-codigo')
        .send({ email: 'usuario@email.com', codigo: 'token_valido' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ valid: true });
    });

    it('Deve retornar 400 para código com tipo inválido sem chamar o service', async () => {
      const response = await request(app)
        .post('/auth/validar-codigo')
        .send({ codigo: 123 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Código inválido.');
      expect(authServiceMock.validarCodigo).not.toHaveBeenCalled();
    });

    it('Deve retornar 400 quando o código for inválido ou expirado', async () => {
      authServiceMock.validarCodigo.mockRejectedValueOnce(new Error('Código inválido ou expirado.'));

      const response = await request(app)
        .post('/auth/validar-codigo')
        .send({ email: 'usuario@email.com', codigo: 'token_errado' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Código inválido ou expirado.');
    });
  });

  describe('POST /auth/redefinir-senha', () => {
    it('Deve retornar 200 ao redefinir senha', async () => {
      authServiceMock.redefinirSenha.mockResolvedValueOnce({ message: REDEFINIR_SENHA_SUCCESS_MESSAGE });

      const response = await request(app)
        .post('/auth/redefinir-senha')
        .send({ token: 'token_valido', novaSenha: '123456' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(REDEFINIR_SENHA_SUCCESS_MESSAGE);
    });

    it('Deve retornar 400 para token com tipo inválido', async () => {
      const response = await request(app)
        .post('/auth/redefinir-senha')
        .send({ token: ['array'], novaSenha: '123456' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Token inválido.');
      expect(authServiceMock.redefinirSenha).not.toHaveBeenCalled();
    });

    it('Deve retornar 400 para novaSenha com tipo inválido', async () => {
      const response = await request(app)
        .post('/auth/redefinir-senha')
        .send({ token: 'abc', novaSenha: 123456 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Nova senha inválido.');
    });
  });
});
