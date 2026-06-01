'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const NEON = '#00FF73';

/**
 * Sticky CTA fixo no rodapé mobile.
 * Aparece após scroll > 400px e some quando o usuário chega no footer
 * (pra não cobrir links de Política/Termos/Suporte).
 */
export default function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        const docHeight = document.documentElement.scrollHeight;
        const viewport = window.innerHeight;
        // Esconde quando o usuário está a < 240px do final da página (zona do footer)
        const nearBottom = scrolled + viewport >= docHeight - 240;
        setVisible(scrolled > 400 && !nearBottom);
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="sm:hidden fixed inset-x-0 bottom-0 z-50 pointer-events-none"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 12,
        background: 'linear-gradient(to top, rgba(18,18,18,0.96) 60%, rgba(18,18,18,0))',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
      }}
    >
      <Link
        href="/quizz"
        className="pointer-events-auto flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-black text-black text-sm tracking-wide whitespace-nowrap active:scale-[0.98] transition-transform"
        style={{
          background: `linear-gradient(135deg, ${NEON} 0%, #00cc5a 100%)`,
          letterSpacing: '-0.01em',
          boxShadow: `0 0 28px ${NEON}55, 0 4px 16px ${NEON}30`,
        }}
      >
        GERAR MEU DIAGNÓSTICO GRÁTIS
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14"/>
          <path d="m12 5 7 7-7 7"/>
        </svg>
      </Link>
      <p
        className="text-center text-[10px] mt-1.5"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        Grátis · 3 min · sem cadastro
      </p>
    </div>
  );
}
