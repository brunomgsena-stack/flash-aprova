import { Resend } from 'resend';
import { WelcomeEmail }      from '@/emails/WelcomeEmail';
import { PasswordResetEmail } from '@/emails/PasswordResetEmail';

// ─── Client (lazy — não lança em build time) ─────────────────────────────────
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!);
  return _resend;
}

const FROM = 'FlashAprova <noreply@flashaprova.com.br>';

// ─── Boas-vindas AiPro+ ───────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name?: string) {
  return getResend().emails.send({
    from:    FROM,
    to,
    subject: '🎉 Bem-vindo ao AiPro+! Seu acesso está liberado.',
    react:   WelcomeEmail({ name: name ?? to.split('@')[0] }),
  });
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
