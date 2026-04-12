
import { Router } from 'express';
import { CaronaController } from '../controllers/CaronaController';
import { CaronaService } from '../services/CaronaService';
import { CaronaRepository } from '../repositories/CaronaRepository';

const caronaRepository = new CaronaRepository();
const caronaService = new CaronaService(caronaRepository);
const caronaController = new CaronaController(caronaService);

const caronaRoutes = Router();

// Rotas de carona
caronaRoutes.post('/', caronaController.create);
caronaRoutes.get('/', caronaController.findAll);
caronaRoutes.get('/ativas', caronaController.findAllActive);
caronaRoutes.get('/:id', caronaController.findById);
caronaRoutes.put('/:id', caronaController.update);
caronaRoutes.patch('/:id/status', caronaController.updateStatus);
caronaRoutes.delete('/:id', caronaController.cancel);

// Rota específica para caronas por motorista
caronaRoutes.get('/motorista/:id', caronaController.findByMotorista);

export { caronaRoutes };