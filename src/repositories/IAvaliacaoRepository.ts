import { Avaliacao } from '../generated/prisma/client';

export interface IAvaliacaoRepository {
  create(avaliacao: Omit<Avaliacao, "id" | "createdAt" | "updatedAt">): Promise<Avaliacao>;
  findByCaronaAndUsers(caronaId: string, avaliadorId: string, avaliadoId: string): Promise<Avaliacao | null>;
  findByAvaliadoId(avaliadoId: string): Promise<Avaliacao[]>;
}
