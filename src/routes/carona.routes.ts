
import { Router } from 'express';
import { CaronaController } from '../controllers/CaronaController';
import { CaronaService } from '../services/CaronaService';
import { CaronaRepository } from '../repositories/CaronaRepository';

const caronaRepository = new CaronaRepository();
const caronaService = new CaronaService(caronaRepository);
const caronaController = new CaronaController(caronaService);

const caronaRoutes = Router();

// Rotas de carona
caronaRoutes.get('/', caronaController.findAll.bind(caronaController));
caronaRoutes.post('/', caronaController.create.bind(caronaController));
caronaRoutes.get('/ativas', caronaController.findAllActive.bind(caronaController));
caronaRoutes.get('/:id', caronaController.findById.bind(caronaController));
caronaRoutes.put('/:id', caronaController.update.bind(caronaController));
caronaRoutes.patch('/:id/status', caronaController.updateStatus.bind(caronaController));
caronaRoutes.delete('/:id', caronaController.cancel.bind(caronaController));

// Rota específica para caronas por motorista
caronaRoutes.get('/motorista/:id', caronaController.findByMotorista.bind(caronaController));

export { caronaRoutes };