'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/** Prefixos de área autenticada onde o Pixel NÃO deve carregar nem rastrear. */
const EXCLUDED_PREFIXES = ['/dashboard', '/director', '/admin', '/demo-admin', '/painel'];

function isExcluded(pathname: string | null): boolean {
  if (!pathname) return true;
  return EXCLUDED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

function loadPixel(pixelId: string) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { fbq?: unknown; _fbq?: unknown };
  if (w.fbq) return;
  /* eslint-disable */
  // @ts-ignore — código-base oficial do Meta Pixel
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  // @ts-ignore
  window.fbq('init', pixelId);
  // @ts-ignore
  window.fbq('track', 'PageView');
}

/**
 * Meta Pixel com carregamento adiado: injeta fbevents.js apenas após a
 * primeira interação do usuário (ou em idle), liberando a thread no carregamento
 * inicial. O CAPI server-side (app/api/meta) cobre a janela inicial.
 * Auto-gating: só atua em rotas públicas. No-op sem NEXT_PUBLIC_META_PIXEL_ID.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const excluded = isExcluded(pathname);
  const loadedRef = useRef(false);
  const firstRun = useRef(true);

  // Carrega o pixel apenas na primeira interação real do usuário.
  // (Sem fallback de idle: bots/Lighthouse não interagem, então não baixam fbevents.
  //  O CAPI server-side cobre PageView inicial.)
  useEffect(() => {
    if (!PIXEL_ID || excluded || loadedRef.current) return;

    const events = ['scroll', 'pointerdown', 'touchstart', 'keydown'] as const;

    const trigger = () => {
      if (loadedRef.current) return;
      loadedRef.current = true;
      cleanup();
      loadPixel(PIXEL_ID);
    };

    const cleanup = () => {
      events.forEach((ev) => window.removeEventListener(ev, trigger));
    };

    events.forEach((ev) => window.addEventListener(ev, trigger, { once: true, passive: true }));

    return cleanup;
  }, [excluded]);

  // PageView em navegações SPA subsequentes (só se já carregou)
  useEffect(() => {
    if (excluded) return;
    if (firstRun.current) { firstRun.current = false; return; }
    const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof fbq !== 'function') return;
    fbq('track', 'PageView');
  }, [pathname, searchParams, excluded]);

  if (!PIXEL_ID || excluded) return null;

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
