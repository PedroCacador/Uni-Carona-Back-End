import { Router } from 'express';
import { VeiculoController } from '../controllers/VeiculoController';
import { VeiculoService } from '../services/VeiculoService';
import { VeiculoRepository } from '../repositories/VeiculoRepository';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const veiculoRoutes = Router();

const veiculoRepository = new VeiculoRepository();
const usuarioRepository = new UsuarioRepository();
const veiculoService = new VeiculoService(veiculoRepository, usuarioRepository);
const veiculoController = new VeiculoController(veiculoService);

veiculoRoutes.post('/', authMiddleware, veiculoController.create.bind(veiculoController));
veiculoRoutes.get('/', authMiddleware, veiculoController.findAll.bind(veiculoController));
veiculoRoutes.get('/:id', authMiddleware, veiculoController.findById.bind(veiculoController));
veiculoRoutes.get('/motorista/:id', authMiddleware, veiculoController.findByProprietario.bind(veiculoController));
veiculoRoutes.put('/:id', authMiddleware, veiculoController.update.bind(veiculoController));
veiculoRoutes.delete('/:id', authMiddleware, veiculoController.delete.bind(veiculoController));

export { veiculoRoutes };
