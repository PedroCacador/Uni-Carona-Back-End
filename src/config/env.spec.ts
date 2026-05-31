import { getEnvOrDefault, getRequiredEnv, validateEnvOnStartup } from './env';

describe('env config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getRequiredEnv', () => {
    it('Deve retornar valor trimado quando configurado', () => {
      process.env.TEST_KEY = '  valor  ';
      expect(getRequiredEnv('TEST_KEY')).toBe('valor');
    });

    it('Deve lançar erro quando ausente ou vazio', () => {
      delete process.env.TEST_KEY;
      expect(() => getRequiredEnv('TEST_KEY')).toThrow(
        'Variável de ambiente obrigatória ausente: TEST_KEY'
      );

      process.env.TEST_KEY = '   ';
      expect(() => getRequiredEnv('TEST_KEY')).toThrow(
        'Variável de ambiente obrigatória ausente: TEST_KEY'
      );
    });
  });

  describe('getEnvOrDefault', () => {
    it('Deve retornar default quando ausente', () => {
      delete process.env.OPTIONAL_KEY;
      expect(getEnvOrDefault('OPTIONAL_KEY', 'padrao')).toBe('padrao');
    });

    it('Deve retornar valor configurado', () => {
      process.env.OPTIONAL_KEY = '1d';
      expect(getEnvOrDefault('OPTIONAL_KEY', 'padrao')).toBe('1d');
    });
  });

  describe('validateEnvOnStartup', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('Deve encerrar processo quando JWT_SECRET estiver vazio', () => {
      process.env.NODE_ENV = 'development';
      process.env.JWT_SECRET = '';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      validateEnvOnStartup();

      expect(errorSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('Deve exigir RESEND_API_KEY e MAIL_FROM em production', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'secret';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.RESEND_API_KEY = '';
      process.env.MAIL_FROM = 'UniCarona <test@resend.dev>';
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      validateEnvOnStartup();

      expect(errorSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });
});
