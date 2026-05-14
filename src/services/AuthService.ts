import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUsuarioRepository } from '../repositories/IUsuarioRepository';

export interface LoginDTO {
  email: string;
  senha: string;
}

export class AuthService {
  constructor(private readonly usuarioRepository: IUsuarioRepository) { }

  async login({ email, senha }: LoginDTO) {
    const usuario = await this.usuarioRepository.findByEmail(email);

    if (!usuario || usuario.status === 'INATIVO') {
      throw new Error('Credenciais inválidas.');
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      throw new Error('Credenciais inválidas.');
    }

    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

    if (!secret) {
      throw new Error('Configuração de segurança ausente (JWT_SECRET).');
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, role: usuario.role },
      secret,
      { expiresIn } as any
    );

    const { senha: _, ...usuarioSemSenha } = usuario;

    return {
      usuario: usuarioSemSenha,
      token,
    };
  }
}
