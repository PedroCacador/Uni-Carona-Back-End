import { prisma } from '../database/db';
import { BaseRepository } from './BaseRepository';
import { Avaliacao } from '../generated/prisma/client';

import { IAvaliacaoRepository } from './IAvaliacaoRepository';

export class AvaliacaoRepository extends BaseRepository<Avaliacao, any, any> implements IAvaliacaoRepository {
  constructor() {
    super(prisma.avaliacao);
  }

  async findByCaronaAndUsers(caronaId: string, avaliadorId: string, avaliadoId: string): Promise<Avaliacao | null> {
    return prisma.avaliacao.findUnique({
      where: {
        caronaId_avaliadorId_avaliadoId: {
          caronaId,
          avaliadorId,
          avaliadoId
        }
      }
    });
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
