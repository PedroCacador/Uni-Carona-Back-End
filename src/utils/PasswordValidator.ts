export const MIN_PASSWORD_LENGTH = 6;

export function isValidPassword(password: string): boolean {
  if (typeof password !== 'string') return false;
  return password.length >= MIN_PASSWORD_LENGTH;
}

export function getPasswordValidationMessage(): string {
  return `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
}
