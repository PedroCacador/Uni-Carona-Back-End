import { Request, Response } from 'express';
import { CaronaService } from '../services/CaronaService';
import { Carona, StatusCarona } from '../generated/prisma/client';

export class CaronaController {
  constructor(private readonly caronaService: CaronaService) {
    
  }

  private sanitize(carona: Carona): Omit<Carona, 'createdAt' | 'updatedAt'> {
    const { createdAt, updatedAt, ...safeCarona } = carona;
    return safeCarona;
  }

  async create(req: Request, res: Response) {
    try {
      const carona = await this.caronaService.create(req.body);
      res.status(201).json(this.sanitize(carona));
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const { origem, destino, status } = req.query;

      const filters: { origem?: string; destino?: string; status?: StatusCarona } = {};

      if (origem) filters.origem = origem as string;
      if (destino) filters.destino = destino as string;
      if (status) filters.status = status as StatusCarona;

      const caronas = await this.caronaService.findAll(filters);
      const safeCaronas = caronas.map(c => this.sanitize(c));
      res.json(safeCaronas);
    } catch (error: any) {
      console.log(error);
      res.status(400).json({ message: error.message });
    }
  }

  async findAllActive(req: Request, res: Response) {
    try {
      const caronas = await this.caronaService.findAllActive();
      const safeCaronas = caronas.map(c => this.sanitize(c));
      res.json(safeCaronas);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async findById(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;
      const carona = await this.caronaService.findById(id);
      res.json(this.sanitize(carona));
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  async findByMotorista(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;
      const caronas = await this.caronaService.findByMotorista(id);
      const safeCaronas = caronas.map(c => this.sanitize(c));
      res.json(safeCaronas);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async update(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;
      const carona = await this.caronaService.update(id, req.body);
      res.json(this.sanitize(carona));
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateStatus(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const carona = await this.caronaService.updateStatus(id, status as StatusCarona);
      res.json(this.sanitize(carona));
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async cancel(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;
      const carona = await this.caronaService.cancelRide(id);
      res.json({
        message: 'Carona cancelada com sucesso',
        carona: this.sanitize(carona)
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}