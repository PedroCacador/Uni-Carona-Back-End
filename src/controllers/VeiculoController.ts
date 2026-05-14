import { Request, Response } from 'express';
import { VeiculoService } from '../services/VeiculoService';

export class VeiculoController {
  constructor(private readonly veiculoService: VeiculoService) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const loggedUserId = req.userId;
      
      // Garante que o proprietário é o usuário logado
      const data = { ...req.body, proprietarioId: loggedUserId };
      
      const veiculo = await this.veiculoService.create(data);
      res.status(201).json(veiculo);
    } catch (error: any) {
      if (
        error.message === 'Este proprietário já possui um veículo cadastrado.' ||
        error.message === 'Já existe um veículo com esta placa.'
      ) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const veiculos = await this.veiculoService.findAll();
      res.json(veiculos);
    } catch (error: any) {
      res.status(500).json({ error: 'Erro ao buscar veículos.' });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const veiculo = await this.veiculoService.findById(id);
      res.json(veiculo);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async findByProprietario(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const veiculo = await this.veiculoService.findByProprietario(id);
      res.json(veiculo);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const loggedUserId = req.userId;
      
      const veiculoExistente = await this.veiculoService.findById(id);
      
      if (veiculoExistente.proprietarioId !== loggedUserId) {
        res.status(403).json({ error: 'Você não tem permissão para atualizar este veículo.' });
        return;
      }

      const veiculo = await this.veiculoService.update(id, req.body);
      res.json(veiculo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const loggedUserId = req.userId;

      const veiculoExistente = await this.veiculoService.findById(id);
      
      if (veiculoExistente.proprietarioId !== loggedUserId) {
        res.status(403).json({ error: 'Você não tem permissão para excluir este veículo.' });
        return;
      }

      await this.veiculoService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
