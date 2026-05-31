import express from 'express';
import request from 'supertest';
import { AuthController } from './AuthController';
import { AuthService, ESQUECI_SENHA_SUCCESS_MESSAGE, REDEFINIR_SENHA_SUCCESS_MESSAGE } from '../services/AuthService';
import {
  resetAuthRateLimitStore,
  validarCodigoRateLimitByIp,
} from '../middlewares/authRateLimitMiddleware';

describe('AuthController (integração HTTP)', () => {
  let authServiceMock: jest.Mocked<AuthService>;
  let app: express.Application;

  beforeEach(() => {
    resetAuthRateLimitStore();
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
    app.post('/auth/validar-codigo', validarCodigoRateLimitByIp, controller.validarCodigo.bind(controller));
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
      expect(response.body).not.toHaveProperty('codigo');
    });
  });

  describe('POST /auth/validar-codigo', () => {
    it('Deve retornar 200 quando o código for válido', async () => {
      authServiceMock.validarCodigo.mockResolvedValueOnce({ valid: true });

      const response = await request(app)
        .post('/auth/validar-codigo')
        .send({ email: 'usuario@email.com', codigo: '123456' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ valid: true });
    });

    it('Deve retornar 429 quando o rate limit for excedido', async () => {
      authServiceMock.validarCodigo.mockResolvedValue({ valid: true });

      for (let i = 0; i < 30; i++) {
        await request(app)
          .post('/auth/validar-codigo')
          .send({ codigo: '123456' });
      }

      const response = await request(app)
        .post('/auth/validar-codigo')
        .send({ codigo: '123456' });

      expect(response.status).toBe(429);
      expect(response.body.message).toContain('Muitas tentativas');
    });

    it('Deve retornar 400 para código com tipo inválido sem chamar o service', async () => {
      const response = await request(app)
        .post('/auth/validar-codigo')
        .send({ codigo: 123 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Código inválido.');
      expect(authServiceMock.validarCodigo).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/redefinir-senha', () => {
    it('Deve retornar 200 ao redefinir senha com codigo', async () => {
      authServiceMock.redefinirSenha.mockResolvedValueOnce({ message: REDEFINIR_SENHA_SUCCESS_MESSAGE });

      const response = await request(app)
        .post('/auth/redefinir-senha')
        .send({ codigo: '123456', novaSenha: '123456' });

      expect(response.status).toBe(200);
      expect(authServiceMock.redefinirSenha).toHaveBeenCalledWith({
        codigo: '123456',
        novaSenha: '123456',
      });
    });

    it('Deve aceitar campo token como alias de codigo', async () => {
      authServiceMock.redefinirSenha.mockResolvedValueOnce({ message: REDEFINIR_SENHA_SUCCESS_MESSAGE });

      const response = await request(app)
        .post('/auth/redefinir-senha')
        .send({ token: '847291', novaSenha: '123456' });

      expect(response.status).toBe(200);
      expect(authServiceMock.redefinirSenha).toHaveBeenCalledWith({
        codigo: '847291',
        novaSenha: '123456',
      });
    });
  });
});
