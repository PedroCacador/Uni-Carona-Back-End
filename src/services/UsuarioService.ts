import crypto from 'crypto';
import { Usuario } from '../generated/prisma/client';
import { IUsuarioRepository } from '../repositories/IUsuarioRepository';

export type CreateUsuarioDTO = Omit<Usuario, 'id' | 'createdAt' | 'updatedAt' | 'status'>;
export type UpdateUsuarioDTO = Partial<Omit<Usuario, 'id' | 'createdAt' | 'updatedAt' | 'email' | 'cpf' | 'status'>>;

export class UsuarioService {
  constructor(private readonly usuarioRepository: IUsuarioRepository) {}

  async create(data: CreateUsuarioDTO): Promise<Usuario> {
    if (!data.nome || data.nome.trim() === '') {
      throw new Error('Nome não pode ser vazio.');
    }
    if (!data.email || data.email.trim() === '') {
      throw new Error('E-mail não pode ser vazio.');
    }

    const emailEmUso = await this.usuarioRepository.findByEmail(data.email);
    if (emailEmUso) {
      throw new Error('E-mail já está em uso.');
    }

    const novoUsuario: Omit<Usuario, "id" | "createdAt" | "updatedAt"> = {
      ...data,
      dataNascimento: new Date(data.dataNascimento),
      senha: `hash_${data.senha}`, // Simulando o hash
      status: 'ATIVO',
    };

    return this.usuarioRepository.create(novoUsuario);
  }

  async findAll(): Promise<Usuario[]> {
    return this.usuarioRepository.findAll();
  }

  async findAllActive(): Promise<Usuario[]> {
    return this.usuarioRepository.findAllActive();
  }

  async findById(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findById(id);
    if (!usuario || usuario.status === 'INATIVO') {
      throw new Error('Usuário não encontrado ou inativo.');
    }
    return usuario;
  }

  async update(id: string, data: UpdateUsuarioDTO): Promise<Usuario> {
    const usuario = await this.findById(id);
    const updateData: Partial<Usuario> & { id: string } = { ...data, id };

    if (data.senha) {
      updateData.senha = `hash_${data.senha}`;
    }
    if (data.dataNascimento) {
      updateData.dataNascimento = new Date(data.dataNascimento);
    }

    return this.usuarioRepository.update(updateData);
  }

  async softDelete(id: string): Promise<void> {
    const usuario = await this.findById(id);
    await this.usuarioRepository.update({ id, status: 'INATIVO' });
  }
}
