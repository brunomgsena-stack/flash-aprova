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

  // ── Plano ───────────────────────────────────────────────────────────────────
  const planInfo = await fetchUserPlan(user.id, user.email ?? undefined);
  if (planInfo.plan !== 'proai_plus') {
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

  // ── Persiste no Supabase (best-effort) ─────────────────────────────────────
  try {
    await serverClient
      .from('essay_submissions')
      .insert({
        user_id:       user.id,
        tema,
        texto,
        nota_total:    result.nota_total,
        feedback_json: result,
        created_at:    new Date().toISOString(),
      });
  } catch {
    // Tabela pode não existir ainda — não bloqueia o retorno
  }

  return NextResponse.json(result);
}
