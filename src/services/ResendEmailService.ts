import { Resend } from 'resend';
import { getRequiredEnv } from '../config/env';
import { IEmailService } from './IEmailService';
import { buildPasswordResetEmailContent } from './email/PasswordResetEmailContent';

export class ResendEmailService implements IEmailService {
  private readonly resend: Resend;

  constructor(resend?: Resend) {
    this.resend = resend ?? new Resend(getRequiredEnv('RESEND_API_KEY'));
  }

  async sendPasswordResetEmail(to: string, resetCode: string): Promise<void> {
    const from = getRequiredEnv('MAIL_FROM');
    const { subject, html, text } = buildPasswordResetEmailContent(resetCode);
    const timestamp = new Date().toISOString();

    try {
      const { data, error } = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
        text,
      });

      if (error) {
        console.error(
          `[ResendEmailService] Falha ao enviar e-mail de recuperação para ${to} em ${timestamp}:`,
          error.message
        );
        throw new Error('Não foi possível enviar o e-mail de recuperação. Tente novamente mais tarde.');
      }

      console.log(
        `[ResendEmailService] E-mail de recuperação enviado com sucesso para ${to} em ${timestamp}${
          data?.id ? ` (id: ${data.id})` : ''
        }`
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Não foi possível enviar')) {
        throw error;
      }

      console.error(
        `[ResendEmailService] Falha ao enviar e-mail de recuperação para ${to} em ${timestamp}:`,
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
      throw new Error('Não foi possível enviar o e-mail de recuperação. Tente novamente mais tarde.');
    }
  }
}
