import { Request, Response } from 'express';
import { CaronaService } from '../services/CaronaService';
import { Carona, StatusCarona, Usuario, Veiculo } from '../generated/prisma/client';
import { sanitizeUsuario, UsuarioPublico } from '../utils/UsuarioSanitizer';

type CaronaComRelacoes = Carona & { motorista?: Usuario | null; veiculo?: Veiculo | null };

export class CaronaController {
  constructor(private readonly caronaService: CaronaService) {
    
  }

  private sanitize(carona: CaronaComRelacoes): Omit<CaronaComRelacoes, 'createdAt' | 'updatedAt' | 'motorista' | 'veiculo'> & {
    motorista?: UsuarioPublico;
    veiculo?: Veiculo;
  } {
    const { createdAt, updatedAt, motorista, veiculo, ...rest } = carona;
    return {
      ...rest,
      ...(motorista ? { motorista: sanitizeUsuario(motorista) } : {}),
      ...(veiculo ? { veiculo } : {}),
    };
  }

  private parseOptionalDate(value: unknown): Date | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const d = new Date(String(value));
    if (isNaN(d.getTime())) {
      throw new Error('Parâmetro de data inválido. Use ISO 8601 (ex.: 2026-04-20T14:00:00.000Z).');
    }
    return d;
  }

  private parseBool(value: unknown): boolean | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const s = String(value).toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes') return true;
    if (s === 'false' || s === '0' || s === 'no') return false;
    throw new Error('Parâmetro booleano inválido. Use true ou false.');
  }

  /** Dia civil em UTC: `data=2026-04-20` → saída entre 00:00 e 23:59:59.999 UTC desse dia */
  private parseDiaOpcional(value: unknown): { min: Date; max: Date } | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const raw = String(value).trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!m) {
      throw new Error('Parâmetro data inválido. Use o formato YYYY-MM-DD (ex.: 2026-04-20).');
    }
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const min = new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0));
    const max = new Date(Date.UTC(y, mo - 1, d, 23, 59, 59, 999));
    return { min, max };
  }

  private parseIntPositivo(value: unknown, nomeCampo: string): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const n = parseInt(String(value), 10);
    if (Number.isNaN(n)) {
      throw new Error(`${nomeCampo} deve ser um número inteiro.`);
    }
    return n;
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
      const { origem, destino, status, motoristaId, apenasFuturas, dataDe, dataAte, data, vagasDisponiveis } = req.query;

      const filters: {
        origem?: string;
        destino?: string;
        status?: StatusCarona;
        motoristaId?: string;
        apenasFuturas?: boolean;
        dataHoraMin?: Date;
        dataHoraMax?: Date;
        vagasDisponiveis?: number;
      } = {};

      if (origem) filters.origem = origem as string;
      if (destino) filters.destino = destino as string;
      if (status) filters.status = status as StatusCarona;
      if (motoristaId) filters.motoristaId = motoristaId as string;

      const af = this.parseBool(apenasFuturas);
      if (af !== undefined) filters.apenasFuturas = af;

      const dia = this.parseDiaOpcional(data);
      if (dia) {
        filters.dataHoraMin = dia.min;
        filters.dataHoraMax = dia.max;
      } else {
        const dMin = this.parseOptionalDate(dataDe);
        if (dMin) filters.dataHoraMin = dMin;

        const dMax = this.parseOptionalDate(dataAte);
        if (dMax) filters.dataHoraMax = dMax;
      }

      const vagas = this.parseIntPositivo(vagasDisponiveis, 'vagasDisponiveis');
      if (vagas !== undefined) filters.vagasDisponiveis = vagas;

      const caronas = await this.caronaService.findAll(filters);
      const safeCaronas = caronas.map(c => this.sanitize(c as CaronaComRelacoes));
      res.json(safeCaronas);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async findAllActive(req: Request, res: Response) {
    try {
      const caronas = await this.caronaService.findAllActive();
      const safeCaronas = caronas.map(c => this.sanitize(c as CaronaComRelacoes));
      res.json(safeCaronas);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async findById(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;
      const carona = await this.caronaService.findById(id);
      res.json(this.sanitize(carona as CaronaComRelacoes));
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  async findByMotorista(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;
      const caronas = await this.caronaService.findByMotorista(id);
      const safeCaronas = caronas.map(c => this.sanitize(c as CaronaComRelacoes));
      res.json(safeCaronas);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async update(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;
      const carona = await this.caronaService.update(id, req.body);
      res.json(this.sanitize(carona as CaronaComRelacoes));
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateStatus(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const carona = await this.caronaService.updateStatus(id, status as StatusCarona);
      res.json(this.sanitize(carona as CaronaComRelacoes));
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
        carona: this.sanitize(carona as CaronaComRelacoes)
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}