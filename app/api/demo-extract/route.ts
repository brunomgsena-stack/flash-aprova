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

  // Extrai nome: <title>
  const nameMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const name = nameMatch ? nameMatch[1].trim().split(/[\|\-–—]/)[0].trim() : undefined;

  // Extrai logo com prioridade: apple-touch-icon > og:image > shortcut icon > icon
  let logo_url: string | undefined;

  const appleTouchMatch =
    html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i) ??
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon["']/i);

  const ogImageMatch =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

  const iconMatch =
    html.match(/<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"']+)["']/i) ??
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut icon|icon)["']/i);

  const rawLogoUrl = appleTouchMatch?.[1] ?? ogImageMatch?.[1] ?? iconMatch?.[1];
  if (rawLogoUrl) {
    logo_url = rawLogoUrl.startsWith('http')
      ? rawLogoUrl
      : `${origin}${rawLogoUrl.startsWith('/') ? '' : '/'}${rawLogoUrl}`;
  }

  // Extrai cor: <meta name="theme-color" content="#...">
  const colorMatch =
    html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["'](#[0-9a-fA-F]{3,6})["']/i) ??
    html.match(/<meta[^>]+content=["'](#[0-9a-fA-F]{3,6})["'][^>]+name=["']theme-color["']/i);
  const primary_color = colorMatch?.[1];

  return NextResponse.json({
    name: name ?? undefined,
    logo_url,
    primary_color,
  });
}
