import { generateResetToken, hashResetToken } from './ResetTokenHelper';

describe('ResetTokenHelper', () => {
  it('Deve gerar token bruto e hash consistentes', () => {
    const { rawToken, tokenHash } = generateResetToken();

    expect(rawToken).toHaveLength(64);
    expect(tokenHash).toBe(hashResetToken(rawToken));
  });

  it('Deve aplicar trim ao hashear token informado', () => {
    const { rawToken } = generateResetToken();
    expect(hashResetToken(`  ${rawToken}  `)).toBe(hashResetToken(rawToken));
  });
});
