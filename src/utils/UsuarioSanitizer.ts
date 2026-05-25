import { Usuario } from '../generated/prisma/client';

export type UsuarioPublico = Omit<Usuario, 'senha' | 'resetPasswordToken' | 'resetPasswordExpires'>;

export function sanitizeUsuario(usuario: Usuario): UsuarioPublico {
  const { senha, resetPasswordToken, resetPasswordExpires, ...safeUsuario } = usuario;
  return safeUsuario;
}
