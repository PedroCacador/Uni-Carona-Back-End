import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { MockEmailService } from '../services/MockEmailService';
import { UsuarioRepository } from '../repositories/UsuarioRepository';

const authRoutes = Router();

const repository = new UsuarioRepository();
const emailService = new MockEmailService();
const service = new AuthService(repository, emailService);
const controller = new AuthController(service);

authRoutes.post('/login', controller.login.bind(controller));
authRoutes.post('/esqueci-senha', controller.esqueciSenha.bind(controller));
authRoutes.post('/redefinir-senha', controller.redefinirSenha.bind(controller));

export { authRoutes };
