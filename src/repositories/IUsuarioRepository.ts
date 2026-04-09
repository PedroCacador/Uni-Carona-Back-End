import { Usuario } from '../models/Usuario';

export interface IUsuarioRepository {
  create(usuario: Usuario): Promise<Usuario>;
  findAll(): Promise<Usuario[]>;
  findAllActive(): Promise<Usuario[]>;
  findById(id: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;
  update(usuario: Usuario): Promise<Usuario>;
}
