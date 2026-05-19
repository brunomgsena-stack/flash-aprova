import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PANEL_COOKIE, verifyPanelToken } from '@/lib/admin-panel-auth';

export async function POST() {
  const store = await cookies();
  const token = store.get(PANEL_COOKIE)?.value;
  const res = NextResponse.json({ ok: true });
  if (token && verifyPanelToken(token)) {
    res.cookies.set(PANEL_COOKIE, '', {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0,
    });
  }
  return res;
}
