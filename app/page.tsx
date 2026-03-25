import type { Metadata } from 'next';
import LandingPage from './LandingPage';

export const metadata: Metadata = {
  title: 'FlashAprova — Memorização com IA para o ENEM',
  description:
    'Garanta 97% de retenção com SRS + IA especialista. +8.000 estudantes já blindaram sua memória para o ENEM com o FlashAprova.',
  openGraph: {
    title: 'FlashAprova — Memorização com IA para o ENEM',
    description: 'Garanta 97% de retenção com SRS + IA especialista no ENEM.',
    type: 'website',
  },
};

export default function HomePage() {
  return <LandingPage />;
}
