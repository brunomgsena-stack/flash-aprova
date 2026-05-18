import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  let code = '';
  try {
    const body = await req.json();
    code = typeof body?.code === 'string' ? body.code.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }
  if (!code || code.length > 32 || !/^[A-Za-z0-9_-]+$/.test(code)) {
    return NextResponse.json({ error: 'Código inválido.' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('redeem_invite_code', { p_code: code });
  if (error) {
    console.error('[api/join] rpc error:', error.message);
    return NextResponse.json({ error: 'Erro ao processar convite.' }, { status: 500 });
  }
  const result = data as { ok: boolean; error?: string };
  if (!result.ok) {
    return NextResponse.json({ error: 'Convite inválido ou expirado.' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
