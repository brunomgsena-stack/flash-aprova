'use client';

import Script from 'next/script';
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

/**
 * Código-base do Meta Pixel + PageView em cada navegação (SPA).
 * Auto-gating: só atua em rotas públicas/marketing. No-op se o env
 * NEXT_PUBLIC_META_PIXEL_ID estiver ausente.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const excluded = isExcluded(pathname);

  const firstRun = useRef(true);

  useEffect(() => {
    if (excluded) return;
    if (firstRun.current) { firstRun.current = false; return; }
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
    window.fbq('track', 'PageView');
  }, [pathname, searchParams, excluded]);

  if (!PIXEL_ID || excluded) return null;

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
