import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { getAiLimiter, getClientIp } from '@/lib/ratelimit';
import { derivePanelToken, PANEL_COOKIE } from '@/lib/admin-panel-auth';

const DENIED = { error: 'Acesso negado' };

function safeEqual(a: string, b: string): boolean {
  const ah = createHash('sha256').update(a).digest();
  const bh = createHash('sha256').update(b).digest();
  return timingSafeEqual(ah, bh);
}

export async function POST(req: NextRequest) {
  // Rate-limit por IP (mesmo padrão do middleware.ts)
  const ip = getClientIp(req);
  const { success } = await getAiLimiter().limit(`painel-login:${ip}`);
  if (!success) return NextResponse.json(DENIED, { status: 429 });

  const expected = process.env.ADMIN_PANEL_PASSWORD;
  if (!expected) return NextResponse.json(DENIED, { status: 401 });

  let password = '';
  try {
    const body = await req.json();
    password = typeof body?.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json(DENIED, { status: 401 });
  }

  if (!safeEqual(password, expected)) {
    return NextResponse.json(DENIED, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PANEL_COOKIE, derivePanelToken(expected), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
  return res;
}
