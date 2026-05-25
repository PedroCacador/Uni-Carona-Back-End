import { Router } from 'express';
import { AvaliacaoController } from '../controllers/AvaliacaoController';
import { AvaliacaoService } from '../services/AvaliacaoService';
import { AvaliacaoRepository } from '../repositories/AvaliacaoRepository';
import { CaronaRepository } from '../repositories/CaronaRepository';
import { ReservaRepository } from '../repositories/ReservaRepository';

const avaliacaoRepository = new AvaliacaoRepository();
const caronaRepository = new CaronaRepository();
const reservaRepository = new ReservaRepository();

const avaliacaoService = new AvaliacaoService(
  avaliacaoRepository,
  caronaRepository,
  reservaRepository
);
const avaliacaoController = new AvaliacaoController(avaliacaoService);

const avaliacaoRoutes = Router();

avaliacaoRoutes.post('/', avaliacaoController.criarAvaliacao.bind(avaliacaoController));
avaliacaoRoutes.get('/usuario/:usuarioId', avaliacaoController.findByUsuarioId.bind(avaliacaoController));

export { avaliacaoRoutes };
