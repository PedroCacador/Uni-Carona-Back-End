const UNIQUE_CONSTRAINT_CODE = 'P2002';

const FIELD_MESSAGES: Record<string, string> = {
  email: 'E-mail já está em uso.',
  cpf: 'CPF já está em uso.',
};

export function getPrismaUniqueField(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('meta' in error)) {
    return undefined;
  }

  const target = (error as { meta?: { target?: string | string[] } }).meta?.target;

  if (Array.isArray(target)) {
    return target[0];
  }

  if (typeof target === 'string') {
    return target;
  }

  return undefined;
}

export function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === UNIQUE_CONSTRAINT_CODE
  );
}

export function mapPrismaUniqueConstraintError(error: unknown): Error {
  const field = getPrismaUniqueField(error);
  const message = field ? FIELD_MESSAGES[field] ?? 'Registro já cadastrado.' : 'Registro já cadastrado.';

  return new Error(message);
}

export function mapPrismaCreateError(error: unknown): Error {
  if (isPrismaUniqueConstraintError(error)) {
    return mapPrismaUniqueConstraintError(error);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Não foi possível concluir o cadastro.');
}
