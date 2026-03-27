import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchUserPlan } from '@/lib/plan';
import { runWorkflow } from '@/lib/agents/norma';

export const runtime = 'nodejs'; // @openai/agents exige Node.js runtime

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  // ── Plano + Admin bypass ────────────────────────────────────────────────────
  const [planInfo, profileResult] = await Promise.all([
    fetchUserPlan(user.id),
    serverClient.from('profiles').select('role').eq('id', user.id).maybeSingle(),
  ]);
  const hasAccess =
    planInfo.plan === 'proai_plus' || profileResult.data?.role === 'admin';
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Recurso exclusivo do plano AiPro+.' },
      { status: 403 },
    );
  }

  // ── Payload ─────────────────────────────────────────────────────────────────
  let tema: string, texto: string;
  try {
    const body = await req.json();
    tema  = (body.tema  ?? '').trim();
    texto = (body.texto ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  if (!tema || texto.split(/\s+/).filter(Boolean).length < 10) {
    return NextResponse.json(
      { error: 'Tema e texto são obrigatórios (mínimo 10 palavras).' },
      { status: 400 },
    );
  }

  // ── Executa Workflow da Norma ────────────────────────────────────────────────
  let result;
  try {
    result = await runWorkflow(tema, texto);
  } catch (e: unknown) {
    console.error('[/api/chat/redacao] runWorkflow error:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Erro na análise da Norma: ${message}` },
      { status: 500 },
    );
  }

  // ── Persiste histórico no Supabase ─────────────────────────────────────────
  const { error: dbError } = await serverClient
    .from('essay_submissions')
    .insert({
      user_id:          user.id,
      tema,
      texto,
      nota_total:       result.nota_total,
      analise_completa: result,        // JSON completo: C1-C5, veredito, repertório
    });

  if (dbError) {
    // Loga mas não bloqueia: o aluno recebe o resultado mesmo se o histórico falhar
    console.error('[/api/chat/redacao] erro ao salvar histórico:', dbError.message);
  }

  return NextResponse.json(result);
}
