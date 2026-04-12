import { Router } from 'express';
import { VeiculoController } from '../controllers/VeiculoController';
import { VeiculoService } from '../services/VeiculoService';
import { VeiculoRepository } from '../repositories/VeiculoRepository';
import { UsuarioRepository } from '../repositories/UsuarioRepository';

const veiculoRoutes = Router();

const veiculoRepository = new VeiculoRepository();
const usuarioRepository = new UsuarioRepository();
const veiculoService = new VeiculoService(veiculoRepository, usuarioRepository);
const veiculoController = new VeiculoController(veiculoService);

veiculoRoutes.post('/', veiculoController.create.bind(veiculoController));
veiculoRoutes.get('/', veiculoController.findAll.bind(veiculoController));
veiculoRoutes.get('/:id', veiculoController.findById.bind(veiculoController));
veiculoRoutes.get('/motorista/:id', veiculoController.findByProprietario.bind(veiculoController));
veiculoRoutes.put('/:id', veiculoController.update.bind(veiculoController));
veiculoRoutes.delete('/:id', veiculoController.delete.bind(veiculoController));

export { veiculoRoutes };
