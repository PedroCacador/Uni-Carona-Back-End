import { Request, Response, NextFunction } from 'express';
import { normalizeEmail } from '../utils/EmailValidator';

export const RATE_LIMIT_MESSAGE = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';

/** Janela padrão: 15 minutos */
export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export const ESQUECI_SENHA_MAX_PER_IP = 10;
export const ESQUECI_SENHA_MAX_PER_EMAIL = 5;
export const VALIDAR_CODIGO_MAX_PER_IP = 30;
export const REDEFINIR_SENHA_MAX_PER_IP = 15;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function resetAuthRateLimitStore(): void {
  rateLimitStore.clear();
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function consumeRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count += 1;
  return true;
}

function createRateLimitMiddleware(
  keyPrefix: string,
  maxRequests: number,
  keyResolver: (req: Request) => string | null,
  windowMs: number = AUTH_RATE_LIMIT_WINDOW_MS
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const suffix = keyResolver(req);
    if (!suffix) {
      return next();
    }

    const key = `${keyPrefix}:${suffix}`;
    if (!consumeRateLimit(key, maxRequests, windowMs)) {
      return res.status(429).json({ message: RATE_LIMIT_MESSAGE });
    }

    return next();
  };
}

export const esqueciSenhaRateLimitByIp = createRateLimitMiddleware(
  'esqueci-senha:ip',
  ESQUECI_SENHA_MAX_PER_IP,
  (req) => getClientIp(req)
);

export const esqueciSenhaRateLimitByEmail = createRateLimitMiddleware(
  'esqueci-senha:email',
  ESQUECI_SENHA_MAX_PER_EMAIL,
  (req) => {
    const email = req.body?.email;
    if (typeof email !== 'string' || email.trim() === '') {
      return null;
    }
    return normalizeEmail(email);
  }
);

export const validarCodigoRateLimitByIp = createRateLimitMiddleware(
  'validar-codigo:ip',
  VALIDAR_CODIGO_MAX_PER_IP,
  (req) => getClientIp(req)
);

export const redefinirSenhaRateLimitByIp = createRateLimitMiddleware(
  'redefinir-senha:ip',
  REDEFINIR_SENHA_MAX_PER_IP,
  (req) => getClientIp(req)
);
