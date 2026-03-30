import type { Metadata } from 'next';
import LandingPage from './LandingPage';

// ─── Canonical URL (swap for production domain) ───────────────────────────────
const SITE_URL = 'https://flashaprova.com.br';

// ─── Rich metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: 'FlashAprova — Flashcards com IA para ENEM | 97% de Retenção',
  description:
    'A plataforma de memorização com IA + SRS que garante 97% de retenção até o dia do ENEM. Diagnóstico personalizado em 3 min. +8.000 estudantes aprovados. Correção de Redação com IA, Tutores Especialistas e +5.700 flashcards táticos.',

  keywords: [
    'flashcards ENEM',
    'flashcards medicina',
    'app para ENEM',
    'memorização com IA',
    'SRS ENEM',
    'melhor app ENEM',
    'correção de redação IA',
    'tutor IA ENEM',
    'flashcards biologia ENEM',
    'revisão espaçada ENEM',
    'FlashAprova',
  ],

  alternates: {
    canonical: SITE_URL,
  },

  openGraph: {
    title: 'FlashAprova — 97% de Retenção com IA para o ENEM',
    description:
      'Diagnóstico IA em 3 min · +5.700 flashcards táticos · 10 Tutores Especialistas · Correção de Redação · +8.000 aprovados.',
    type: 'website',
    url: SITE_URL,
    siteName: 'FlashAprova',
    locale: 'pt_BR',
    // next/og image generated in app/opengraph-image.tsx is auto-injected by Next.js
  },

  twitter: {
    card: 'summary_large_image',
    title: 'FlashAprova — Memorização com IA para o ENEM',
    description:
      'Garanta 97% de retenção. +8.000 aprovados. Diagnóstico IA grátis em 3 minutos.',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// ─── JSON-LD structured data ───────────────────────────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#app`,
      name: 'FlashAprova',
      url: SITE_URL,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web, iOS Safari, Android Chrome',
      description:
        'Plataforma de memorização com IA + SRS para o ENEM. Flashcards táticos, diagnóstico personalizado, tutores IA por disciplina e correção de redação.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'BRL',
        description: 'Plano gratuito com acesso a flashcards e diagnóstico IA.',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '8000',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        'Diagnóstico por IA em 3 minutos',
        '+5.700 flashcards táticos para o ENEM',
        '10 Tutores IA especializados por disciplina',
        'Correção de redação com IA baseada no ENEM',
        'Algoritmo SRS de revisão espaçada',
        'Mapa Neural de domínio em tempo real',
      ],
    },
    {
      '@type': 'EducationalOrganization',
      '@id': `${SITE_URL}/#org`,
      name: 'FlashAprova',
      url: SITE_URL,
      description:
        'Plataforma de tecnologia educacional especializada em preparação para o ENEM com inteligência artificial.',
      knowsAbout: [
        'ENEM',
        'Vestibular',
        'Memorização',
        'Revisão Espaçada',
        'Inteligência Artificial na Educação',
        'Redação ENEM',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'FlashAprova',
      description: 'Flashcards com IA para o ENEM',
      publisher: { '@id': `${SITE_URL}/#org` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/onboarding`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'O FlashAprova é gratuito?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sim. O plano gratuito dá acesso a centenas de flashcards e ao Diagnóstico por IA sem cartão de crédito. Para acesso ilimitado, existe o plano AiPro+.',
          },
        },
        {
          '@type': 'Question',
          name: 'Em quanto tempo vejo resultado com o FlashAprova?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A maioria dos alunos relata melhora perceptível em retenção após 7 dias de uso consistente. Alunos com 60+ dias apresentam 30% mais acertos nas disciplinas treinadas.',
          },
        },
        {
          '@type': 'Question',
          name: 'O FlashAprova funciona para Medicina e outros vestibulares?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sim. O conteúdo cobre todas as disciplinas do ENEM que também são cobradas em vestibulares de Medicina como FUVEST, UNICAMP e UFMG.',
          },
        },
      ],
    },
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
