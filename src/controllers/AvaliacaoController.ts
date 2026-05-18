import { Request, Response } from 'express';
import { AvaliacaoService } from '../services/AvaliacaoService';
import { Avaliacao } from '../models/Avaliacao';

export class AvaliacaoController {
  constructor(private avaliacaoService: AvaliacaoService) { }

  async criarAvaliacao(req: Request, res: Response) {
    try {
      const data: Omit<Avaliacao, "id" | "createdAt" | "updatedAt"> = req.body;
      const novaAvaliacao = await this.avaliacaoService.criarAvaliacao(data);
      res.status(201).json(novaAvaliacao);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async findByUsuarioId(req: Request<{ usuarioId: string }>, res: Response) {
    try {
      const { usuarioId } = req.params;
      const avaliacoes = await this.avaliacaoService.findByAvaliadoId(usuarioId);
      res.json(avaliacoes);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
