import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUsuarioRepository } from '../repositories/IUsuarioRepository';
import { IEmailService } from './IEmailService';
import { isValidEmail, normalizeEmail } from '../utils/EmailValidator';
import { getPasswordValidationMessage, isValidPassword } from '../utils/PasswordValidator';
import { generateResetToken, hashResetToken } from '../utils/ResetTokenHelper';
import { sanitizeUsuario } from '../utils/UsuarioSanitizer';

export interface LoginDTO {
  email: string;
  senha: string;
}

export interface EsqueciSenhaDTO {
  email: string;
}

export interface RedefinirSenhaDTO {
  token: string;
  novaSenha: string;
}

const DEFAULT_RESET_EXPIRES_MINUTES = 15;

export const ESQUECI_SENHA_SUCCESS_MESSAGE =
  'Se o e-mail existir, um link de recuperação foi enviado.';

export const REDEFINIR_SENHA_SUCCESS_MESSAGE = 'Senha redefinida com sucesso.';

export class AuthService {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly emailService: IEmailService
  ) {}

  async login({ email, senha }: LoginDTO) {
    const normalizedEmail = normalizeEmail(email);
    const usuario = await this.usuarioRepository.findByEmail(normalizedEmail);

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
      { expiresIn } as jwt.SignOptions
    );

    return {
      usuario: sanitizeUsuario(usuario),
      token,
    };
  }

  async esqueciSenha({ email }: EsqueciSenhaDTO): Promise<{ message: string }> {
    if (typeof email !== 'string' || email.trim() === '') {
      throw new Error('E-mail é obrigatório.');
    }

    if (!isValidEmail(email)) {
      throw new Error('E-mail inválido.');
    }

    const normalizedEmail = normalizeEmail(email);
    const usuario = await this.usuarioRepository.findByEmail(normalizedEmail);

    if (usuario && usuario.status === 'ATIVO') {
      const { rawToken, tokenHash } = generateResetToken();
      const expiresAt = this.getResetTokenExpirationDate();

      await this.usuarioRepository.update({
        id: usuario.id,
        resetPasswordToken: tokenHash,
        resetPasswordExpires: expiresAt,
      });

      await this.emailService.sendPasswordResetEmail(normalizedEmail, rawToken);
    }

    return { message: ESQUECI_SENHA_SUCCESS_MESSAGE };
  }

  async redefinirSenha({ token, novaSenha }: RedefinirSenhaDTO): Promise<{ message: string }> {
    if (typeof token !== 'string' || token.trim() === '') {
      throw new Error('Token é obrigatório.');
    }

    if (typeof novaSenha !== 'string' || novaSenha.trim() === '') {
      throw new Error('Nova senha é obrigatória.');
    }

    if (!isValidPassword(novaSenha)) {
      throw new Error(getPasswordValidationMessage());
    }

    const tokenHash = hashResetToken(token);
    const usuario = await this.usuarioRepository.findByResetPasswordToken(tokenHash);

    if (!usuario) {
      throw new Error('Token inválido ou expirado.');
    }

    const hashedPassword = await bcrypt.hash(novaSenha, 10);

    await this.usuarioRepository.update({
      id: usuario.id,
      senha: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return { message: REDEFINIR_SENHA_SUCCESS_MESSAGE };
  }

  private getResetTokenExpirationDate(): Date {
    const minutes = parseInt(
      process.env.RESET_PASSWORD_EXPIRES_MINUTES || String(DEFAULT_RESET_EXPIRES_MINUTES),
      10
    );
    const safeMinutes = Number.isNaN(minutes) || minutes <= 0 ? DEFAULT_RESET_EXPIRES_MINUTES : minutes;
    return new Date(Date.now() + safeMinutes * 60 * 1000);
  }
}
