import { IEmailService } from './IEmailService';

export class MockEmailService implements IEmailService {
  /**
   * Simula envio de e-mail em desenvolvimento.
   * Em produção (NODE_ENV=production), ResendEmailService envia o e-mail real.
   */
  async sendPasswordResetEmail(to: string, _resetCode: string): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(
      `[MockEmailService] E-mail de recuperação simulado para ${to} em ${timestamp} (NODE_ENV=development)`
    );
    console.log(
      '[MockEmailService] Em produção o código de 6 dígitos seria enviado via Resend (código não registrado em log).'
    );
  }
}
