import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { UsuarioService } from '../services/UsuarioService';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const usuarioRoutes = Router();

const repository = new UsuarioRepository();
const service = new UsuarioService(repository);
const controller = new UsuarioController(service);

usuarioRoutes.post('/', controller.create.bind(controller));
usuarioRoutes.get('/', authMiddleware, controller.findAll.bind(controller));
usuarioRoutes.get('/:id', authMiddleware, controller.findById.bind(controller));
usuarioRoutes.patch('/:id', authMiddleware, controller.update.bind(controller));
usuarioRoutes.delete('/:id', authMiddleware, controller.delete.bind(controller));

export { usuarioRoutes };
