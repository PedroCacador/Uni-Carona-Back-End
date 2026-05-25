import { IAvaliacaoRepository } from '../repositories/IAvaliacaoRepository';
import { CaronaRepository } from '../repositories/CaronaRepository';
import { ReservaRepository } from '../repositories/ReservaRepository';
import { Avaliacao, StatusCarona, StatusReserva } from '../generated/prisma/client';

export class AvaliacaoService {
  constructor(
    private avaliacaoRepository: IAvaliacaoRepository,
    private caronaRepository: CaronaRepository,
    private reservaRepository: ReservaRepository
  ) {}

  async criarAvaliacao(data: Omit<Avaliacao, "id" | "createdAt" | "updatedAt">): Promise<Avaliacao> {
    const { caronaId, avaliadorId, avaliadoId, nota } = data;

    if (avaliadorId === avaliadoId) {
      throw new Error('Autoavaliação não é permitida.');
    }

    if (nota < 1 || nota > 5) {
      throw new Error('A nota deve ser entre 1 e 5.');
    }

    const carona = await this.caronaRepository.findById(caronaId);
    if (!carona) {
      throw new Error('Carona não encontrada.');
    }

    if (carona.status !== StatusCarona.FINALIZADA) {
      throw new Error('A carona precisa estar finalizada para ser avaliada.');
    }

    // Validação de vínculo: verifica se existe reserva confirmada
    const reservasDaCarona = await this.reservaRepository.findByCaronaId(caronaId);
    
    let vinculoValido = false;
    
    if (avaliadorId === carona.motoristaId) {
      // Motorista avaliando passageiro
      const reserva = reservasDaCarona.find(
        r => (r as any).passageiroId === avaliadoId || (r as any).usuarioId === avaliadoId
      );
      if (reserva && reserva.status === StatusReserva.CONFIRMADA) {
        vinculoValido = true;
      }
    } else if (avaliadoId === carona.motoristaId) {
      // Passageiro avaliando motorista
      const reserva = reservasDaCarona.find(
        r => (r as any).passageiroId === avaliadorId || (r as any).usuarioId === avaliadorId
      );
      if (reserva && reserva.status === StatusReserva.CONFIRMADA) {
        vinculoValido = true;
      }
    }

    if (!vinculoValido) {
      throw new Error('Não existe vínculo válido de carona entre os usuários.');
    }

    const avaliacaoExistente = await this.avaliacaoRepository.findByCaronaAndUsers(
      caronaId,
      avaliadorId,
      avaliadoId
    );

    if (avaliacaoExistente) {
      throw new Error('Esta avaliação já foi realizada.');
    }

    return this.avaliacaoRepository.create(data);
  }

  async findByAvaliadoId(usuarioId: string): Promise<Avaliacao[]> {
    return this.avaliacaoRepository.findByAvaliadoId(usuarioId);
  }
}
