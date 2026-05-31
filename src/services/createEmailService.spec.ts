import { createEmailService } from './createEmailService';
import { MockEmailService } from './MockEmailService';
import { ResendEmailService } from './ResendEmailService';

describe('createEmailService', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('Deve retornar MockEmailService em development', () => {
    process.env.NODE_ENV = 'development';
    const service = createEmailService();
    expect(service).toBeInstanceOf(MockEmailService);
  });

  it('Deve retornar ResendEmailService em production', () => {
    process.env.NODE_ENV = 'production';
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.MAIL_FROM = 'UniCarona <onboarding@resend.dev>';

    const service = createEmailService();
    expect(service).toBeInstanceOf(ResendEmailService);
  });
});
