import { Request, Response } from 'express';
import { ReservaService } from '../services/ReservaService';
import { StatusReserva } from '../generated/prisma/client';

export class ReservaController {
    constructor(private readonly reservaService: ReservaService) { }

    async create(req: Request, res: Response) {
        try {
            const reserva = await this.reservaService.create(req.body);
            res.status(201).json(reserva);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async findAll(req: Request, res: Response) {
        try {
            const reservas = await this.reservaService.findAll();
            res.json(reservas);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async findById(req: Request<{ id: string }>, res: Response) {
        try {
            const { id } = req.params;
            const reserva = await this.reservaService.findById(id);
            res.json(reserva);
        } catch (error: any) {
            res.status(404).json({ message: error.message });
        }
    }

    async findByCaronaId(req: Request<{ caronaId: string }>, res: Response) {
        try {
            const { caronaId } = req.params;
            const reservas = await this.reservaService.findByCaronaId(caronaId);
            res.json(reservas);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async findByUsuarioId(req: Request<{ usuarioId: string }>, res: Response) {
        try {
            const { usuarioId } = req.params;
            const reservas = await this.reservaService.findByUsuarioId(usuarioId);
            res.json(reservas);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async updateStatus(req: Request<{ id: string }>, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const reserva = await this.reservaService.updateStatus(id, status as StatusReserva);
            res.json(reserva);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async cancel(req: Request<{ id: string }>, res: Response) {
        try {
            const { id } = req.params;
            const reserva = await this.reservaService.cancel(id);
            res.json({ message: 'Reserva cancelada com sucesso', reserva });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
