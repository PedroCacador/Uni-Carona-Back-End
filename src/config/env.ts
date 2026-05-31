const STARTUP_ENV_CHECKS: Array<{
  key: string;
  message: string;
}> = [
  {
    key: 'JWT_SECRET',
    message: '❌ JWT_SECRET não configurado.\nConfigure a variável no arquivo .env.',
  },
  {
    key: 'DATABASE_URL',
    message: '❌ DATABASE_URL não configurado.\nConfigure a variável no arquivo .env.',
  },
];

import { isProductionEnvironment } from './environment';

const PRODUCTION_RESEND_ENV_CHECKS: Array<{
  key: string;
  message: string;
}> = [
  {
    key: 'RESEND_API_KEY',
    message: '❌ RESEND_API_KEY não configurado.\nObtenha a chave em https://resend.com/api-keys e configure no .env.',
  },
  {
    key: 'MAIL_FROM',
    message: '❌ MAIL_FROM não configurado.\nExemplo: UniCarona <onboarding@resend.dev>',
  },
];

export function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }

  return value;
}

export function getEnvOrDefault(name: string, defaultValue: string): string {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : defaultValue;
}

export function validateEnvOnStartup(): void {
  const checks = isProductionEnvironment()
    ? [...STARTUP_ENV_CHECKS, ...PRODUCTION_RESEND_ENV_CHECKS]
    : STARTUP_ENV_CHECKS;

  const errors = checks.filter(({ key }) => !process.env[key]?.trim()).map(({ message }) => message);

  if (errors.length > 0) {
    console.error(errors.join('\n\n'));
    process.exit(1);
  }
}
