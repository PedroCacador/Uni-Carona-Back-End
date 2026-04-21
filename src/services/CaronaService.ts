import { CaronaRepository } from '../repositories/CaronaRepository';
import { Carona, StatusCarona } from '../generated/prisma/client';
import { Decimal } from 'decimal.js';

export type CreateCaronaDTO = Omit<Carona, "id" | "createdAt" | "updatedAt" | "status">;
export type UpdateCaronaDTO = Partial<Omit<Carona, "id" | "createdAt" | "updatedAt">>;

export class CaronaService {
  constructor(private readonly caronaRepository: CaronaRepository) { }

  async create(data: CreateCaronaDTO): Promise<Carona> {
    if (!data.motoristaId || !data.veiculoId || !data.origem ||
      !data.destino || !data.dataHoraSaida || data.assentosDisponiveis === undefined || data.assentosDisponiveis === null) {
      throw new Error('Campos obrigatórios: motoristaId, veiculoId, origem, destino, dataHoraSaida, assentosDisponiveis');
    }

    if (data.assentosDisponiveis < 1 || data.assentosDisponiveis > 8) {
      throw new Error('Assentos disponíveis devem ser entre 1 e 8');
    }

    if (data.valorAjuda !== null && data.valorAjuda !== undefined) {
      if (typeof data.valorAjuda === 'number' && data.valorAjuda < 0) {
        throw new Error('Valor de ajuda não pode ser negativo');
      }
    }

    const dataHoraSaida = new Date(data.dataHoraSaida);
    if (isNaN(dataHoraSaida.getTime())) {
      throw new Error('Data e hora inválidas');
    }

    if (dataHoraSaida <= new Date()) {
      throw new Error('Data e hora devem ser futuras');
    }

    const payload = {
      ...data,
      dataHoraSaida
    };

    return this.caronaRepository.create(payload);
  }

  async findAll(filters?: {
    origem?: string;
    destino?: string;
    status?: StatusCarona;
    motoristaId?: string;
    apenasFuturas?: boolean;
    dataHoraMin?: Date;
    dataHoraMax?: Date;
    vagasDisponiveis?: number;
  }): Promise<Carona[]> {
    if (filters?.vagasDisponiveis !== undefined) {
      if (!Number.isInteger(filters.vagasDisponiveis) || filters.vagasDisponiveis < 1 || filters.vagasDisponiveis > 8) {
        throw new Error('vagasDisponiveis deve ser um inteiro entre 1 e 8.');
      }
    }
    return this.caronaRepository.findAll(filters);
  }

  async findAllActive(): Promise<Carona[]> {
    return this.caronaRepository.findAll({
      status: StatusCarona.AGENDADA
    });
  }

  async findById(id: string): Promise<Carona> {
    if (!id) {
      throw new Error('ID inválido');
    }

    const carona = await this.caronaRepository.findById(id);

    if (!carona) {
      throw new Error('Carona não encontrada');
    }

    return carona;
  }

  async findByMotorista(motoristaId: string): Promise<Carona[]> {
    if (!motoristaId) {
      throw new Error('ID do motorista inválido');
    }

    return this.caronaRepository.findByMotorista(motoristaId);
  }

  async update(id: string, data: UpdateCaronaDTO): Promise<Carona> {
    const caronaExistente = await this.findById(id);

    if (caronaExistente.status !== StatusCarona.AGENDADA) {
      throw new Error('Só é possível editar caronas agendadas');
    }

    if (data.assentosDisponiveis !== undefined && (data.assentosDisponiveis < 1 || data.assentosDisponiveis > 8)) {
      throw new Error('Assentos disponíveis devem ser entre 1 e 8');
    }

    if (data.valorAjuda !== undefined && data.valorAjuda !== null) {
      // Conversão ou verificação
    }

    const payload = { ...data };

    if (data.dataHoraSaida) {
      const newDate = new Date(data.dataHoraSaida);
      if (isNaN(newDate.getTime())) {
        throw new Error('Data e hora inválidas');
      }
      if (newDate <= new Date()) {
        throw new Error('Data e hora devem ser futuras');
      }
      payload.dataHoraSaida = newDate;
    }

    const caronaAtualizada = await this.caronaRepository.update(id, payload);

    if (!caronaAtualizada) {
      throw new Error('Erro ao atualizar carona');
    }

    return caronaAtualizada;
  }

  async updateStatus(id: string, status: StatusCarona): Promise<Carona> {
    const caronaExistente = await this.findById(id);

    if (caronaExistente.status === StatusCarona.FINALIZADA) {
      throw new Error('Não é possível alterar status de uma carona já finalizada');
    }

    if (caronaExistente.status === StatusCarona.CANCELADA) {
      throw new Error('Não é possível alterar status de uma carona já cancelada');
    }

    if (status === StatusCarona.CANCELADA) {
      return this.caronaRepository.updateStatus(id, status);
    }

    if (status === StatusCarona.EM_ANDAMENTO && caronaExistente.status !== StatusCarona.AGENDADA) {
      throw new Error('Apenas caronas agendadas podem iniciar');
    }

    if (status === StatusCarona.FINALIZADA && caronaExistente.status !== StatusCarona.EM_ANDAMENTO) {
      throw new Error('Apenas caronas em andamento podem ser finalizadas');
    }

    return this.caronaRepository.updateStatus(id, status);
  }

  async cancelRide(id: string): Promise<Carona> {
    const caronaExistente = await this.findById(id);

    if (caronaExistente.status === StatusCarona.FINALIZADA) {
      throw new Error('Não é possível cancelar uma carona já finalizada');
    }

    if (caronaExistente.status === StatusCarona.CANCELADA) {
      throw new Error('Carona já está cancelada');
    }

    return this.caronaRepository.updateStatus(id, StatusCarona.CANCELADA);
  }
}