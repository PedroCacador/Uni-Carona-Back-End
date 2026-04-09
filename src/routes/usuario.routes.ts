import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { UsuarioService } from '../services/UsuarioService';
import { UsuarioRepositoryInMemory } from '../repositories/UsuarioRepositoryInMemory';

const usuarioRoutes = Router();

const repository = new UsuarioRepositoryInMemory();
const service = new UsuarioService(repository);
const controller = new UsuarioController(service);

usuarioRoutes.post('/', controller.create.bind(controller));
usuarioRoutes.get('/', controller.findAll.bind(controller));
usuarioRoutes.get('/:id', controller.findById.bind(controller));
usuarioRoutes.patch('/:id', controller.update.bind(controller));
usuarioRoutes.delete('/:id', controller.delete.bind(controller));

export { usuarioRoutes };
