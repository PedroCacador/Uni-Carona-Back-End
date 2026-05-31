import { getEnvOrDefault } from '../../config/env';

export interface PasswordResetEmailContent {
  subject: string;
  html: string;
  text: string;
}

export function buildPasswordResetEmailContent(resetCode: string): PasswordResetEmailContent {
  const expiresMinutes = getEnvOrDefault('RESET_PASSWORD_EXPIRES_MINUTES', '15');
  const subject = 'Recuperação de senha - UniCarona';
  const formattedCode = resetCode;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;font-size:24px;line-height:1.2;color:#ffffff;">UniCarona</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#dbeafe;">Recuperação de senha</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Olá,</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
                Recebemos uma solicitação para redefinir a senha da sua conta UniCarona.
              </p>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#4b5563;text-align:center;">
                Seu código de recuperação é:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;padding:20px 32px;border:2px solid #2563eb;border-radius:12px;background:#eff6ff;">
                      <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1d4ed8;font-family:'Courier New',Courier,monospace;">
                        ${formattedCode}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#4b5563;text-align:center;">
                Este código expira em <strong>${expiresMinutes} minutos</strong>.
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6b7280;">
                Caso você não tenha solicitado a recuperação da senha, ignore este e-mail.
              </p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;">
                Atenciosamente,<br />
                <strong>Equipe UniCarona</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">© UniCarona — Caronas universitárias</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = [
    'UniCarona - Recuperação de senha',
    '',
    'Olá,',
    '',
    'Recebemos uma solicitação para redefinir a senha da sua conta UniCarona.',
    '',
    'Seu código de recuperação é:',
    '',
    formattedCode,
    '',
    `Este código expira em ${expiresMinutes} minutos.`,
    '',
    'Caso você não tenha solicitado a recuperação da senha, ignore este e-mail.',
    '',
    'Atenciosamente,',
    'Equipe UniCarona',
  ].join('\n');

  return { subject, html, text };
}
