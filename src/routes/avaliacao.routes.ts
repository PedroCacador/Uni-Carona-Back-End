import { Router } from 'express';
import { AvaliacaoController } from '../controllers/AvaliacaoController';
import { AvaliacaoService } from '../services/AvaliacaoService';
import { AvaliacaoRepository } from '../repositories/AvaliacaoRepository';

const avaliacaoRepository = new AvaliacaoRepository();
const avaliacaoService = new AvaliacaoService(avaliacaoRepository);
const avaliacaoController = new AvaliacaoController(avaliacaoService);

const avaliacaoRoutes = Router();

avaliacaoRoutes.get('/usuario/:usuarioId', avaliacaoController.findByUsuarioId.bind(avaliacaoController));

export { avaliacaoRoutes };
