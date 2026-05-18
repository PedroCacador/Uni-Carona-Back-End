import { IAvaliacaoRepository } from '../repositories/IAvaliacaoRepository';
import { IUsuarioRepository } from '../repositories/IUsuarioRepository';
import { CaronaRepository } from '../repositories/CaronaRepository';
import { ReservaRepository } from '../repositories/ReservaRepository';
import { StatusCarona, StatusReserva } from '../generated/prisma/client';
import { Avaliacao } from '../models/Avaliacao';

export class AvaliacaoService {
  constructor(
    private avaliacaoRepository: IAvaliacaoRepository,
    private caronaRepository: CaronaRepository,
    private reservaRepository: ReservaRepository,
    private usuarioRepository: IUsuarioRepository
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

    const novaAvaliacao = await this.avaliacaoRepository.create(data);

    // Atualizar as métricas do usuário avaliado
    const todasAvaliacoes = await this.avaliacaoRepository.findByAvaliadoId(avaliadoId);
    const totalAvaliacoes = todasAvaliacoes.length;
    
    const somaNotas = todasAvaliacoes.reduce((acc, curr) => acc + curr.nota, 0);
    const mediaAvaliacao = totalAvaliacoes > 0 ? somaNotas / totalAvaliacoes : 0;

    await this.usuarioRepository.update({
      id: avaliadoId,
      mediaAvaliacao,
      totalAvaliacoes
    });

    return novaAvaliacao;
  }

  async findByAvaliadoId(usuarioId: string): Promise<Avaliacao[]> {
    return this.avaliacaoRepository.findByAvaliadoId(usuarioId);
  }
}
