export interface IEmailService {
  sendPasswordResetEmail(to: string, resetToken: string): Promise<void>;
}
