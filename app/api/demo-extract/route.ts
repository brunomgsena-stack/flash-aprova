import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const rawUrl: string = body?.url ?? '';

  if (!rawUrl) {
    return NextResponse.json({});
  }

  // Normaliza URL: garante que tem protocolo
  let url: string;
  try {
    url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    new URL(url); // valida
  } catch {
    return NextResponse.json({});
  }

  // Fetch com timeout de 5s
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  let html = '';
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    html = await res.text();
  } catch {
    return NextResponse.json({});
  } finally {
    clearTimeout(timeoutId);
  }

  const origin = new URL(url).origin;

  function toAbsoluteUrl(raw: string): string {
    if (raw.startsWith('http')) return raw;
    if (raw.startsWith('//')) return `https:${raw}`;
    return `${origin}${raw.startsWith('/') ? '' : '/'}${raw}`;
  }

  // Extrai nome: <title> (pega só o primeiro segmento antes de separador)
  const nameMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const name = nameMatch ? nameMatch[1].trim().split(/[\|\-–—]/)[0].trim() : undefined;

  // Extrai logo com prioridade:
  // 1. apple-touch-icon  2. og:image  3. <img> com "logo" no src/alt/class
  // 4. icon/shortcut icon  5. /favicon.ico
  let logo_url: string | undefined;

  const appleTouchMatch =
    html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i) ??
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon["']/i);

  const ogImageMatch =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

  // <img> que contenha "logo" no src, alt ou class
  const imgLogoMatch = html.match(
    /<img[^>]+(?:src|alt|class)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i
  ) ?? html.match(
    /<img[^>]+src=["']([^"']+logo[^"']+)["']/i
  );

  const iconMatch =
    html.match(/<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"'?#]+)["']/i) ??
    html.match(/<link[^>]+href=["']([^"'?#]+)["'][^>]+rel=["'](?:shortcut icon|icon)["']/i);

  const rawLogoUrl =
    appleTouchMatch?.[1] ??
    ogImageMatch?.[1] ??
    imgLogoMatch?.[1] ??
    iconMatch?.[1];

  if (rawLogoUrl) {
    logo_url = toAbsoluteUrl(rawLogoUrl);
  } else {
    // Fallback: tenta /favicon.ico (quase todo site tem)
    logo_url = `${origin}/favicon.ico`;
  }

  // Extrai cor primária — várias estratégias em ordem de confiança:
  // 1. <meta name="theme-color">
  // 2. CSS: background-color em <header> ou <nav>
  // 3. CSS: primeira cor hex em variável --primary ou --brand
  let primary_color: string | undefined;

  const themeColorMatch =
    html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["'](#[0-9a-fA-F]{3,6})["']/i) ??
    html.match(/<meta[^>]+content=["'](#[0-9a-fA-F]{3,6})["'][^>]+name=["']theme-color["']/i);

  if (themeColorMatch) {
    primary_color = themeColorMatch[1];
  } else {
    // Procura cor em variáveis CSS comuns
    const cssVarMatch = html.match(/--(?:primary|brand|main|accent|color-primary)[^:]*:\s*(#[0-9a-fA-F]{3,6})/i);
    if (cssVarMatch) {
      primary_color = cssVarMatch[1];
    } else {
      // Procura background-color dentro de <header> ou <nav>
      const headerBlock = html.match(/<(?:header|nav)[^>]*style=["'][^"']*background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})/i);
      if (headerBlock) primary_color = headerBlock[1];
    }
  }

  return NextResponse.json({
    name: name ?? undefined,
    logo_url,
    primary_color,
  });
}
