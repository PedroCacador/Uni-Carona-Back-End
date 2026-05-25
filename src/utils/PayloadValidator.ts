export function assertStringField(value: unknown, fieldLabel: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldLabel} inválido.`);
  }
  return value;
}
