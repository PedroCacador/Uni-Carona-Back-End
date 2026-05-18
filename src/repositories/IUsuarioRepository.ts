import { Usuario } from '../generated/prisma/client';

export interface IUsuarioRepository {
  create(usuario: Omit<Usuario, "id" | "createdAt" | "updatedAt" | "mediaAvaliacao" | "totalAvaliacoes">): Promise<Usuario>;
  findAll(): Promise<Usuario[]>;
  findAllActive(): Promise<Usuario[]>;
  findById(id: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;
  update(usuario: Partial<Usuario> & { id: string }): Promise<Usuario>;
}
