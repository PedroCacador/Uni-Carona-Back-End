import { Usuario } from '../models/Usuario';
import { IUsuarioRepository } from './IUsuarioRepository';

export class UsuarioRepositoryInMemory implements IUsuarioRepository {
  private usuarios: Usuario[] = [];

  async create(usuario: Usuario): Promise<Usuario> {
    this.usuarios.push(usuario);
    return usuario;
  }

  async findAll(): Promise<Usuario[]> {
    return this.usuarios;
  }

  async findAllActive(): Promise<Usuario[]> {
    return this.usuarios.filter(u => u.status === 'ATIVO');
  }

  async findById(id: string): Promise<Usuario | null> {
    const usuario = this.usuarios.find(u => u.id === id);
    return usuario || null;
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const usuario = this.usuarios.find(u => u.email === email);
    return usuario || null;
  }

  async update(usuario: Usuario): Promise<Usuario> {
    const index = this.usuarios.findIndex(u => u.id === usuario.id);
    if (index !== -1) {
      this.usuarios[index] = usuario;
    }
    return usuario;
  }
}
