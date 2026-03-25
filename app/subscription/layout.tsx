import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planos — FlashAprova',
  description:
    'Desbloqueie o AiPro+ e tenha acesso ilimitado a +5.700 flashcards, Tutores IA especializados e correção de redação.',
};

export default function SubscriptionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
