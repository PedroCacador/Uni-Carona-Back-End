import { CaronaRepository } from '../repositories/CaronaRepository';
import { Carona, CreateCaronaDTO, UpdateCaronaDTO, StatusCarona } from '../models/Carona';
import { Reserva } from '../models/Reserva';

export class CaronaService {
  constructor(private readonly caronaRepository: CaronaRepository) { }

  async create(data: CreateCaronaDTO): Promise<Carona> {
    // Validações
    if (!data.motoristaId || !data.veiculoId || !data.origem ||
      !data.destino || !data.dataHoraSaida || !data.assentosDisponiveis) {
      throw new Error('Campos obrigatórios: motoristaId, veiculoId, origem, destino, dataHoraSaida, assentosDisponiveis');
    }

    if (data.assentosDisponiveis < 1 || data.assentosDisponiveis > 8) {
      throw new Error('Assentos disponíveis devem ser entre 1 e 8');
    }

    if (data.valorAjuda !== undefined && data.valorAjuda < 0) {
      throw new Error('Valor de ajuda não pode ser negativo');
    }

    const dataHoraSaida = new Date(data.dataHoraSaida);
    if (isNaN(dataHoraSaida.getTime())) {
      throw new Error('Data e hora inválidas');
    }

    if (dataHoraSaida <= new Date()) {
      throw new Error('Data e hora devem ser futuras');
    }

    // Verificar se motorista existe (chamaria outro service)
    // const motorista = await this.usuarioService.findById(data.motoristaId);
    // if (!motorista) throw new Error('Motorista não encontrado');

    // Verificar se veículo pertence ao motorista
    // const veiculo = await this.veiculoService.findByIdAndMotorista(data.veiculoId, data.motoristaId);
    // if (!veiculo) throw new Error('Veículo não encontrado ou não pertence ao motorista');

    const carona = await this.caronaRepository.create(data);
    return carona;
  }

  async createReserva(data: Reserva): Promise<Reserva> {
    // Validações
    if (!data.caronaId || !data.passageiroId) {
      throw new Error(`Campos obrigatórios: ${data.caronaId}, ${data.passageiroId}`);
    }

    if (data.assentosDisponiveis < 1 || data.assentosDisponiveis > 8) {
      throw new Error('Assentos disponíveis devem ser entre 1 e 8');
    }

    const reserva = await this.caronaRepository.createReserva(data);
    return reserva;
  }


  async findAll(filters?: {
    origem?: string;
    destino?: string;
    status?: StatusCarona;
  }): Promise<Carona[]> {
    const caronas = await this.caronaRepository.findAll(filters);
    return caronas;
  }

  async findAllActive(): Promise<Carona[]> {
    const caronas = await this.caronaRepository.findAll({
      status: StatusCarona.AGENDADA
    });
    return caronas;
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

    const caronas = await this.caronaRepository.findByMotorista(motoristaId);
    return caronas;
  }

  async update(id: string, data: UpdateCaronaDTO): Promise<Carona> {
    const caronaExistente = await this.findById(id);

    if (caronaExistente.status !== StatusCarona.AGENDADA) {
      throw new Error('Só é possível editar caronas agendadas');
    }

    if (data.assentosDisponiveis !== undefined && (data.assentosDisponiveis < 1 || data.assentosDisponiveis > 8)) {
      throw new Error('Assentos disponíveis devem ser entre 1 e 8');
    }

    if (data.valorAjuda !== undefined && data.valorAjuda < 0) {
      throw new Error('Valor de ajuda não pode ser negativo');
    }

    if (data.dataHoraSaida) {
      const newDate = new Date(data.dataHoraSaida);
      if (isNaN(newDate.getTime())) {
        throw new Error('Data e hora inválidas');
      }
      if (newDate <= new Date()) {
        throw new Error('Data e hora devem ser futuras');
      }
    }

    const caronaAtualizada = await this.caronaRepository.update(id, data);

    if (!caronaAtualizada) {
      throw new Error('Erro ao atualizar carona');
    }

    return caronaAtualizada;
  }

  async updateStatus(id: string, status: StatusCarona): Promise<Carona> {
    const caronaExistente = await this.findById(id);

    // Validações de transição de status
    if (caronaExistente.status === StatusCarona.FINALIZADA) {
      throw new Error('Não é possível alterar status de uma carona já finalizada');
    }

    if (caronaExistente.status === StatusCarona.CANCELADA) {
      throw new Error('Não é possível alterar status de uma carona já cancelada');
    }

    // Se tentar cancelar, permitir
    if (status === StatusCarona.CANCELADA) {
      const caronaCancelada = await this.caronaRepository.updateStatus(id, status);
      if (!caronaCancelada) throw new Error('Erro ao cancelar carona');
      return caronaCancelada;
    }

    // Transições normais: AGENDADA -> EM_ANDAMENTO -> FINALIZADA
    if (status === StatusCarona.EM_ANDAMENTO && caronaExistente.status !== StatusCarona.AGENDADA) {
      throw new Error('Apenas caronas agendadas podem iniciar');
    }

    if (status === StatusCarona.FINALIZADA && caronaExistente.status !== StatusCarona.EM_ANDAMENTO) {
      throw new Error('Apenas caronas em andamento podem ser finalizadas');
    }

    const caronaAtualizada = await this.caronaRepository.updateStatus(id, status);

    if (!caronaAtualizada) {
      throw new Error('Erro ao atualizar status');
    }

    return caronaAtualizada;
  }

  async cancelRide(id: string): Promise<Carona> {
    const caronaExistente = await this.findById(id);

    if (caronaExistente.status === StatusCarona.FINALIZADA) {
      throw new Error('Não é possível cancelar uma carona já finalizada');
    }

    if (caronaExistente.status === StatusCarona.CANCELADA) {
      throw new Error('Carona já está cancelada');
    }

    const caronaCancelada = await this.caronaRepository.updateStatus(id, StatusCarona.CANCELADA);

    if (!caronaCancelada) {
      throw new Error('Erro ao cancelar carona');
    }

    return caronaCancelada;
  }
}