
import { Router, Request, Response } from 'express';
import { CaronaController } from '../controllers/CaronaController';
import { CaronaService } from '../services/CaronaService';
import { CaronaRepository } from '../repositories/CaronaRepository';

const caronaRepository = new CaronaRepository();
const caronaService = new CaronaService(caronaRepository);
const caronaController = new CaronaController(caronaService);

const caronaRoutes = Router();

// Rotas de carona
caronaRoutes.post('/', (req: Request, res: Response) => caronaController.create(req, res));
caronaRoutes.get('/', (req: Request, res: Response) => caronaController.findAll(req, res));
caronaRoutes.get('/ativas', (req: Request, res: Response) => caronaController.findAllActive(req, res));
caronaRoutes.get('/:id', (req: Request<{ id: string }>, res: Response) => caronaController.findById(req, res));
caronaRoutes.put('/:id', (req: Request<{ id: string }>, res: Response) => caronaController.update(req, res));
caronaRoutes.patch('/:id/status', (req: Request<{ id: string }>, res: Response) => caronaController.updateStatus(req, res));
caronaRoutes.delete('/:id', (req: Request<{ id: string }>, res: Response) => caronaController.cancel(req, res));

// Rota específica para caronas por motorista
caronaRoutes.get('/motorista/:id', (req: Request<{ id: string }>, res: Response) => caronaController.findByMotorista(req, res));

export { caronaRoutes };