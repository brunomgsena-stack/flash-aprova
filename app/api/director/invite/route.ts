import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/director/invite
// Body: { class_id: string }
// Returns: { code: string, join_url: string, expires_at: string }
export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'director' || !profile.school_id) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  // Parse body
  let body: { class_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  if (!body.class_id) {
    return NextResponse.json({ error: 'class_id é obrigatório' }, { status: 400 });
  }

  // Verify class belongs to director's school
  const admin = createAdminClient();
  const { data: cls } = await admin
    .from('classes')
    .select('id')
    .eq('id', body.class_id)
    .eq('school_id', profile.school_id)
    .maybeSingle();

  if (!cls) {
    return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 });
  }

  // Generate unique 8-char alphanumeric code
  const code = nanoid(8).toUpperCase();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await admin.from('invite_codes').insert({
    school_id:  profile.school_id,
    class_id:   body.class_id,
    code,
    created_by: user.id,
    expires_at: expiresAt,
    max_uses:   100,
  });

  if (error) {
    console.error('[invite] insert error:', error.message);
    return NextResponse.json({ error: 'Erro ao gerar código' }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  return NextResponse.json({
    code,
    join_url:   `${baseUrl}/join/${code}`,
    expires_at: expiresAt,
  });
}
