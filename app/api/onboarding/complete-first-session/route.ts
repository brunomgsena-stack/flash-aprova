import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as adminSupa } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function makeAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return adminSupa(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST() {
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[complete-first-session] SUPABASE_SERVICE_ROLE_KEY ausente.');
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }

  const admin = makeAdmin();
  const { error } = await admin
    .from('profiles')
    .update({ first_session_completed: true })
    .eq('id', user.id);

  if (error) {
    console.error('[complete-first-session] update falhou:', error.code, error.message);
    return NextResponse.json({ error: 'update_failed', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
