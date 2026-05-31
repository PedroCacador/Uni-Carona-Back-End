export interface IEmailService {
  sendPasswordResetEmail(to: string, resetCode: string): Promise<void>;
}
