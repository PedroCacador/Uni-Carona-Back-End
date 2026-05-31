import { Request, Response } from 'express';
import {
  AUTH_RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MESSAGE,
  esqueciSenhaRateLimitByEmail,
  esqueciSenhaRateLimitByIp,
  resetAuthRateLimitStore,
  validarCodigoRateLimitByIp,
} from './authRateLimitMiddleware';

function createMockReq(ip = '127.0.0.1', body: Record<string, unknown> = {}): Request {
  return {
    ip,
    socket: { remoteAddress: ip },
    headers: {},
    body,
  } as Request;
}

function createMockRes() {
  const res = {
    statusCode: 200,
    body: {} as Record<string, unknown>,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: Record<string, unknown>) {
      this.body = payload;
      return this;
    },
  };
  return res as Response & { statusCode: number; body: Record<string, unknown> };
}

describe('authRateLimitMiddleware', () => {
  beforeEach(() => {
    resetAuthRateLimitStore();
  });

  it('Deve bloquear após exceder limite por IP em validar-codigo', () => {
    const next = jest.fn();
    const req = createMockReq('10.0.0.1');

    for (let i = 0; i < 30; i++) {
      validarCodigoRateLimitByIp(req, createMockRes(), next);
    }

    const res = createMockRes();
    validarCodigoRateLimitByIp(req, res, next);

    expect(res.statusCode).toBe(429);
    expect(res.body.message).toBe(RATE_LIMIT_MESSAGE);
  });

  it('Deve aplicar limite por e-mail em esqueci-senha', () => {
    const next = jest.fn();
    const req = createMockReq('10.0.0.2', { email: 'usuario@teste.com' });

    for (let i = 0; i < 5; i++) {
      esqueciSenhaRateLimitByEmail(req, createMockRes(), next);
    }

    const res = createMockRes();
    esqueciSenhaRateLimitByEmail(req, res, next);

    expect(res.statusCode).toBe(429);
    expect(res.body.message).toBe(RATE_LIMIT_MESSAGE);
  });

  it('Deve aplicar limite por IP em esqueci-senha', () => {
    const next = jest.fn();
    const req = createMockReq('10.0.0.3');

    for (let i = 0; i < 10; i++) {
      esqueciSenhaRateLimitByIp(req, createMockRes(), next);
    }

    const res = createMockRes();
    esqueciSenhaRateLimitByIp(req, res, next);

    expect(res.statusCode).toBe(429);
  });

  it('Deve usar janela de 15 minutos', () => {
    expect(AUTH_RATE_LIMIT_WINDOW_MS).toBe(15 * 60 * 1000);
  });
});
