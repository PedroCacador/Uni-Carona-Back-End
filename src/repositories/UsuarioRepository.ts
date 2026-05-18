import { prisma } from '../database/db';
import { IUsuarioRepository } from './IUsuarioRepository';
import { Usuario } from '../generated/prisma/client';

export class UsuarioRepository implements IUsuarioRepository {

  async create(usuario: Omit<Usuario, "id" | "createdAt" | "updatedAt" | "mediaAvaliacao" | "totalAvaliacoes">): Promise<Usuario> {
    return prisma.usuario.create({
      data: usuario
    });
  }

  async findAll(): Promise<Usuario[]> {
    return prisma.usuario.findMany();
  }

  async findAllActive(): Promise<Usuario[]> {
    return prisma.usuario.findMany({
      where: { status: 'ATIVO' }
    });
  }

  async findById(id: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({
      where: { id }
    });
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({
      where: { email }
    });
  }

  async update(usuario: Partial<Usuario> & { id: string }): Promise<Usuario> {
    const { id, ...data } = usuario;
    return prisma.usuario.update({
      where: { id },
      data
    });
  }
}
