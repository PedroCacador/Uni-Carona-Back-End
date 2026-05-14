
import { Router } from 'express';
import { CaronaController } from '../controllers/CaronaController';
import { CaronaService } from '../services/CaronaService';
import { CaronaRepository } from '../repositories/CaronaRepository';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const caronaRepository = new CaronaRepository();
const caronaService = new CaronaService(caronaRepository);
const caronaController = new CaronaController(caronaService);

const caronaRoutes = Router();

// Rotas estáticas antes de /:id (ordem importa no Express)
caronaRoutes.get('/', caronaController.findAll.bind(caronaController));
caronaRoutes.post('/', authMiddleware, caronaController.create.bind(caronaController));
// Busca com padrão para passageiros: só AGENDADA + saída futura (pode sobrescrever via query)
caronaRoutes.get('/buscar', (req, res) => {
  const q = req.query as Record<string, string | undefined>;
  if (q.status === undefined) q.status = 'AGENDADA';
  if (q.apenasFuturas === undefined) q.apenasFuturas = 'true';
  return caronaController.findAll(req, res);
});
caronaRoutes.get('/ativas', caronaController.findAllActive.bind(caronaController));
caronaRoutes.get('/motorista/:id', caronaController.findByMotorista.bind(caronaController));

caronaRoutes.get('/:id', caronaController.findById.bind(caronaController));
caronaRoutes.put('/:id', authMiddleware, caronaController.update.bind(caronaController));
caronaRoutes.patch('/:id/status', authMiddleware, caronaController.updateStatus.bind(caronaController));
caronaRoutes.delete('/:id', authMiddleware, caronaController.cancel.bind(caronaController));

export { caronaRoutes };