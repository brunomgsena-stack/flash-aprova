import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recuperar senha — FlashAprova',
  description: 'Informe seu e-mail para receber o link de recuperação de senha.',
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
