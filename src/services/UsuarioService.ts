import bcrypt from 'bcryptjs';
import { Usuario } from '../generated/prisma/client';
import { IUsuarioRepository } from '../repositories/IUsuarioRepository';
import { isValidCPF } from '../utils/CpfValidator';

export type CreateUsuarioDTO = Omit<
  Usuario,
  'id' | 'createdAt' | 'updatedAt' | 'status' | 'role' | 'resetPasswordToken' | 'resetPasswordExpires'
> & { role?: string };
export type UpdateUsuarioDTO = Partial<
  Omit<Usuario, 'id' | 'createdAt' | 'updatedAt' | 'email' | 'cpf' | 'status' | 'resetPasswordToken' | 'resetPasswordExpires'>
>;

export class UsuarioService {
  constructor(private readonly usuarioRepository: IUsuarioRepository) {}

  async create(data: CreateUsuarioDTO): Promise<Usuario> {
    if (!data.nome || data.nome.trim() === '') {
      throw new Error('Nome não pode ser vazio.');
    }
    if (!data.email || data.email.trim() === '') {
      throw new Error('E-mail não pode ser vazio.');
    }
    
    if (!data.cpf || !isValidCPF(data.cpf)) {
      throw new Error('CPF inválido.');
    }

    const emailEmUso = await this.usuarioRepository.findByEmail(data.email);
    if (emailEmUso) {
      throw new Error('E-mail já está em uso.');
    }

    const hashedPassword = await bcrypt.hash(data.senha, 10);

    const novoUsuario: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      dataNascimento: new Date(data.dataNascimento),
      senha: hashedPassword,
      status: 'ATIVO',
      role: (data.role as Usuario['role']) || 'USER',
      resetPasswordToken: null,
      resetPasswordExpires: null,
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
    await this.findById(id);
    const updateData: Partial<Usuario> & { id: string } = { ...data, id };

    if (data.senha) {
      updateData.senha = await bcrypt.hash(data.senha, 10);
    }
    if (data.dataNascimento) {
      updateData.dataNascimento = new Date(data.dataNascimento);
    }

    return this.usuarioRepository.update(updateData);
  }

  async softDelete(id: string): Promise<void> {
    await this.findById(id);
    await this.usuarioRepository.update({ id, status: 'INATIVO' });
  }
}
