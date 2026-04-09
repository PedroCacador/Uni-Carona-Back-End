import crypto from 'crypto';
import { Usuario } from '../models/Usuario';
import { IUsuarioRepository } from '../repositories/IUsuarioRepository';

export type CreateUsuarioDTO = Pick<Usuario, 'nome' | 'email' | 'whatsapp' | 'curso'> & { senha: string };
export type UpdateUsuarioDTO = Partial<Pick<Usuario, 'nome' | 'whatsapp' | 'curso'>> & { senha?: string };

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

    const agora = new Date();
    const novoUsuario: Usuario = {
      id: crypto.randomUUID(),
      nome: data.nome,
      email: data.email,
      senhaHash: `hash_${data.senha}`, // Respeitando a regra de hash manual
      whatsapp: data.whatsapp,
      curso: data.curso,
      status: 'ATIVO',
      mediaAvaliacao: 0,
      totalAvaliacoes: 0,
      createdAt: agora,
      updatedAt: agora,
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

    if (data.nome) usuario.nome = data.nome;
    if (data.whatsapp) usuario.whatsapp = data.whatsapp;
    if (data.curso) usuario.curso = data.curso;
    if (data.senha) usuario.senhaHash = `hash_${data.senha}`;

    usuario.updatedAt = new Date();

    return this.usuarioRepository.update(usuario);
  }

  async softDelete(id: string): Promise<void> {
    const usuario = await this.findById(id);
    usuario.status = 'INATIVO';
    usuario.updatedAt = new Date();
    await this.usuarioRepository.update(usuario);
  }
}
