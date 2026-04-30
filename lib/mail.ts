import { Resend } from 'resend';
import { WelcomeEmail }        from '@/emails/WelcomeEmail';
import { PasswordResetEmail }  from '@/emails/PasswordResetEmail';
import { AccessGrantedEmail }  from '@/emails/AccessGrantedEmail';

// ─── Client (lazy — não lança em build time) ─────────────────────────────────
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!);
  return _resend;
}

const FROM = 'FlashAprova <contato@flashaprova.app>';

// ─── Boas-vindas AiPro+ ───────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name?: string) {
  return getResend().emails.send({
    from:    FROM,
    to,
    subject: '🎉 Bem-vindo ao AiPro+! Seu acesso está liberado.',
    react:   WelcomeEmail({ name: name ?? to.split('@')[0] }),
  });
}

// ─── Acesso concedido (pós-pagamento) ────────────────────────────────────────
export async function sendAccessGrantedEmail(opts: {
  to:           string;
  name:         string;
  planName:     string;
  loginUrl:     string;
  tempPassword?: string;
}) {
  const result = await getResend().emails.send({
    from:    FROM,
    to:      opts.to,
    subject: `[ VEREDITO: ACESSO CONCEDIDO — ${opts.planName.toUpperCase()} ]`,
    react:   AccessGrantedEmail({
      name:         opts.name,
      email:        opts.to,
      planName:     opts.planName,
      loginUrl:     opts.loginUrl,
      tempPassword: opts.tempPassword,
    }),
  });
  console.log('[mail] sendAccessGrantedEmail result:', JSON.stringify(result));
  if (result.error) {
    throw new Error(`Resend error: ${result.error.name} — ${result.error.message}`);
  }
  return result;
}

// ─── Reset de senha ───────────────────────────────────────────────────────────
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return getResend().emails.send({
    from:    FROM,
    to,
    subject: 'Redefinir sua senha — FlashAprova',
    react:   PasswordResetEmail({ resetUrl }),
  });
}
