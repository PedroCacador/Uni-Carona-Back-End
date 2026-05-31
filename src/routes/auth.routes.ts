import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { createEmailService } from '../services/createEmailService';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import {
  esqueciSenhaRateLimitByEmail,
  esqueciSenhaRateLimitByIp,
  redefinirSenhaRateLimitByIp,
  validarCodigoRateLimitByIp,
} from '../middlewares/authRateLimitMiddleware';

const authRoutes = Router();

const repository = new UsuarioRepository();
const emailService = createEmailService();
const service = new AuthService(repository, emailService);
const controller = new AuthController(service);

authRoutes.post('/login', controller.login.bind(controller));
authRoutes.post(
  '/esqueci-senha',
  esqueciSenhaRateLimitByIp,
  esqueciSenhaRateLimitByEmail,
  controller.esqueciSenha.bind(controller)
);
authRoutes.post('/validar-codigo', validarCodigoRateLimitByIp, controller.validarCodigo.bind(controller));
authRoutes.post('/redefinir-senha', redefinirSenhaRateLimitByIp, controller.redefinirSenha.bind(controller));

export { authRoutes };
