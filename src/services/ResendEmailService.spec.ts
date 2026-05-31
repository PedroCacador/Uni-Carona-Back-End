import { Resend } from 'resend';
import { ResendEmailService } from './ResendEmailService';
import { buildPasswordResetEmailContent } from './email/PasswordResetEmailContent';

describe('ResendEmailService', () => {
  const sendMock = jest.fn();

  beforeEach(() => {
    process.env.MAIL_FROM = 'UniCarona <onboarding@resend.dev>';
    sendMock.mockReset();
  });

  it('Deve enviar e-mail via Resend com código de 6 dígitos', async () => {
    sendMock.mockResolvedValueOnce({ data: { id: 'email-123' }, error: null });
    const resendMock = { emails: { send: sendMock } } as unknown as Resend;
    const service = new ResendEmailService(resendMock);

    await service.sendPasswordResetEmail('usuario@email.com', '847291');

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'UniCarona <onboarding@resend.dev>',
        to: 'usuario@email.com',
        subject: 'Recuperação de senha - UniCarona',
        html: expect.stringContaining('847291'),
        text: expect.stringContaining('847291'),
      })
    );
    expect(sendMock.mock.calls[0][0].html).not.toContain('resetar-senha?token');
  });

  it('Deve lançar erro amigável quando a API Resend retornar error', async () => {
    sendMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid API key', name: 'validation_error' },
    });
    const resendMock = { emails: { send: sendMock } } as unknown as Resend;
    const service = new ResendEmailService(resendMock);

    await expect(service.sendPasswordResetEmail('usuario@email.com', '123456')).rejects.toThrow(
      'Não foi possível enviar o e-mail de recuperação'
    );
  });
});

describe('buildPasswordResetEmailContent', () => {
  it('Deve destacar o código no HTML e texto sem link de recuperação', () => {
    process.env.RESET_PASSWORD_EXPIRES_MINUTES = '15';
    const content = buildPasswordResetEmailContent('123456');

    expect(content.html).toContain('123456');
    expect(content.html).not.toContain('resetar-senha');
    expect(content.text).toContain('123456');
    expect(content.text).not.toContain('http');
    expect(content).not.toHaveProperty('resetUrl');
  });
});
