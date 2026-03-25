import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nova senha — FlashAprova',
  description: 'Defina sua nova senha para acessar o FlashAprova.',
};

export default function UpdatePasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
