import { AvaliacaoRepository } from '../repositories/AvaliacaoRepository';
import { Avaliacao } from '../generated/prisma/client';

export class AvaliacaoService {
  constructor(private readonly avaliacaoRepository: AvaliacaoRepository) {}

  async findByUsuarioId(usuarioId: string): Promise<Avaliacao[]> {
    return this.avaliacaoRepository.findByAvaliadoId(usuarioId);
  }
}
