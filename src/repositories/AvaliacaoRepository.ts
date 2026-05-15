import { prisma } from '../database/db';
import { BaseRepository } from './BaseRepository';
import { Avaliacao } from '../generated/prisma/client';

export class AvaliacaoRepository extends BaseRepository<Avaliacao, any, any> {
  constructor() {
    super(prisma.avaliacao);
  }

  async findByAvaliadoId(avaliadoId: string): Promise<Avaliacao[]> {
    return prisma.avaliacao.findMany({
      where: { avaliadoId },
      include: {
        avaliador: true,
        carona: true
      }
    });
  }
}
