import { IEmailService } from './IEmailService';

export class MockEmailService implements IEmailService {
  /**
   * Simula envio de e-mail em desenvolvimento.
   * Em produção, substituir por implementação real de IEmailService.
   */
  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${frontendUrl}/resetar-senha?token=${resetToken}`;
    console.log(`[EmailService] Link de recuperação para ${to}: ${link}`);
  }
}
