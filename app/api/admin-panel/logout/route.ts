import { NextResponse } from 'next/server';
import { PANEL_COOKIE } from '@/lib/admin-panel-auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PANEL_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
