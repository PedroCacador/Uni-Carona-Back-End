import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUsuarioRepository } from '../repositories/IUsuarioRepository';
import { IEmailService } from './IEmailService';
import { isValidEmail, normalizeEmail } from '../utils/EmailValidator';
import { getPasswordValidationMessage, isValidPassword } from '../utils/PasswordValidator';
import {
  generateResetCode,
  hashResetCode,
  isValidResetCodeFormat,
  normalizeResetCode,
} from '../utils/ResetTokenHelper';
import { sanitizeUsuario } from '../utils/UsuarioSanitizer';
import { getEnvOrDefault, getRequiredEnv } from '../config/env';

export interface LoginDTO {
  email: string;
  senha: string;
}

export interface EsqueciSenhaDTO {
  email: string;
}

export interface RedefinirSenhaDTO {
  codigo: string;
  novaSenha: string;
}

export interface ValidarCodigoDTO {
  email?: string;
  codigo: string;
}

const DEFAULT_RESET_EXPIRES_MINUTES = 15;

export const ESQUECI_SENHA_SUCCESS_MESSAGE =
  'Se o e-mail existir, um código de recuperação foi enviado.';

export const REDEFINIR_SENHA_SUCCESS_MESSAGE = 'Senha redefinida com sucesso.';

export const CODIGO_INVALIDO_MESSAGE = 'Código inválido ou expirado.';

export const CODIGO_FORMATO_INVALIDO_MESSAGE =
  'Código inválido. Informe 6 dígitos numéricos.';

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

    const secret = getRequiredEnv('JWT_SECRET');
    const expiresIn = getEnvOrDefault('JWT_EXPIRES_IN', '1d');

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
      const { rawCode, codeHash } = generateResetCode();
      const expiresAt = this.getResetTokenExpirationDate();

      // E-mail antes da persistência: evita código válido no banco sem entrega (B1).
      await this.emailService.sendPasswordResetEmail(normalizedEmail, rawCode);

      await this.usuarioRepository.update({
        id: usuario.id,
        resetPasswordToken: codeHash,
        resetPasswordExpires: expiresAt,
      });
    }

    return { message: ESQUECI_SENHA_SUCCESS_MESSAGE };
  }

  async validarCodigo({ email, codigo }: ValidarCodigoDTO): Promise<{ valid: true }> {
    const normalizedCode = this.resolveResetCode(codigo);
    const codeHash = hashResetCode(normalizedCode);
    const usuario = await this.usuarioRepository.findByResetPasswordToken(codeHash);

    if (!usuario) {
      throw new Error(CODIGO_INVALIDO_MESSAGE);
    }

    if (
      typeof email === 'string' &&
      email.trim() !== '' &&
      normalizeEmail(email) !== normalizeEmail(usuario.email)
    ) {
      throw new Error(CODIGO_INVALIDO_MESSAGE);
    }

    return { valid: true };
  }

  async redefinirSenha({ codigo, novaSenha }: RedefinirSenhaDTO): Promise<{ message: string }> {
    const normalizedCode = this.resolveResetCode(codigo);

    if (typeof novaSenha !== 'string' || novaSenha.trim() === '') {
      throw new Error('Nova senha é obrigatória.');
    }

    if (!isValidPassword(novaSenha)) {
      throw new Error(getPasswordValidationMessage());
    }

    const codeHash = hashResetCode(normalizedCode);
    const usuario = await this.usuarioRepository.findByResetPasswordToken(codeHash);

    if (!usuario) {
      throw new Error(CODIGO_INVALIDO_MESSAGE);
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

  private resolveResetCode(codigo: unknown): string {
    if (typeof codigo !== 'string' || codigo.trim() === '') {
      throw new Error('Código é obrigatório.');
    }

    if (!isValidResetCodeFormat(codigo)) {
      throw new Error(CODIGO_FORMATO_INVALIDO_MESSAGE);
    }

    return normalizeResetCode(codigo);
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
