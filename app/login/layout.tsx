import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entrar — FlashAprova',
  description: 'Faça login ou crie sua conta para acessar o FlashAprova e começar a estudar.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
