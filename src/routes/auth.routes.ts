import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { UsuarioRepository } from '../repositories/UsuarioRepository';

const authRoutes = Router();

const repository = new UsuarioRepository();
const service = new AuthService(repository);
const controller = new AuthController(service);

authRoutes.post('/login', controller.login.bind(controller));

export { authRoutes };
