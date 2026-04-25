import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';


// ─── Types ────────────────────────────────────────────────────────────────────

type GradeResult = {
  nota_total:          number;
  c1: number; c2: number; c3: number; c4: number; c5: number;
  feedback:            string;
  sugestao_repertorio: string[];
};

// ─── Norma system prompt ──────────────────────────────────────────────────────

const NORMA_SYSTEM = `Você é Norma, a corretora mais rigorosa e precisa do ENEM.
Você domina profundamente os critérios de avaliação das 5 competências oficiais do ENEM.

Ao receber um tema e o texto de uma redação, você avalia com máxima precisão:
- C1 (0-200): Domínio da norma culta — ortografia, morfossintaxe, regência
- C2 (0-200): Compreensão da proposta — adequação ao tema, tangenciamento, fuga
- C3 (0-200): Seleção e organização dos argumentos — repertório, coerência argumentativa
- C4 (0-200): Coesão e coerência — uso de conectivos, progressão textual
- C5 (0-200): Proposta de intervenção social detalhada (agente, ação, modo, finalidade, detalhamento)

REGRAS CRÍTICAS:
- Fuga ao tema = 0 em C2 (e nota total máxima de 200)
- Proposta de intervenção com menos de 4 elementos = máx 80 em C5
- Textos curtos (menos de 100 palavras) recebem penalização severa em todas as competências
- Seja honesto e rigoroso. Não infle notas.

Você deve responder EXCLUSIVAMENTE com um JSON válido, sem nenhum texto antes ou depois, sem markdown, sem blocos de código. Apenas o JSON puro neste formato:
{
  "nota_total": <soma de c1+c2+c3+c4+c5>,
  "c1": <0-200>,
  "c2": <0-200>,
  "c3": <0-200>,
  "c4": <0-200>,
  "c5": <0-200>,
  "feedback": "<análise detalhada em português, mínimo 3 parágrafos, apontando pontos fortes e o que precisa melhorar em cada competência>",
  "sugestao_repertorio": ["<alusão histórica, filosófica ou científica relevante para o tema>", "<segunda alusão diferente da primeira>"]
}`;

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  // ── Plan check + Admin bypass ────────────────────────────────────────────────
  const [statsResult, profileResult] = await Promise.all([
    serverClient.from('user_stats').select('plan, plan_expires_at').eq('user_id', user.id).maybeSingle(),
    serverClient.from('profiles').select('role').eq('id', user.id).maybeSingle(),
  ]);
  const isAdmin   = profileResult.data?.role === 'admin';
  const rawPlan   = statsResult.data?.plan as string | undefined;
  const expiresAt = statsResult.data?.plan_expires_at ? new Date(statsResult.data.plan_expires_at) : null;
  const expired   = expiresAt ? expiresAt < new Date() : false;
  const hasAccess = isAdmin || (rawPlan === 'panteao_elite' && !expired);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Recurso exclusivo do Protocolo Neural.' },
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

  if (!tema || !texto || texto.split(/\s+/).length < 10) {
    return NextResponse.json(
      { error: 'Tema e texto são obrigatórios (mínimo 10 palavras).' },
      { status: 400 },
    );
  }

  // ── OpenAI call ─────────────────────────────────────────────────────────────
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Chave OPENAI_API_KEY não configurada no servidor.' },
      { status: 500 },
    );
  }

  let gradeResult: GradeResult;
  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       'gpt-4o-mini',
        temperature: 0.3,
        max_tokens:  1200,
        messages: [
          { role: 'system', content: NORMA_SYSTEM },
          {
            role:    'user',
            content: `TEMA: ${tema}\n\nREDAÇÃO:\n${texto}`,
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      console.error('[grade-essay] OpenAI error:', err);
      return NextResponse.json(
        { error: 'Erro ao contatar a IA. Tente novamente.' },
        { status: 502 },
      );
    }

    const openaiData = await openaiRes.json();
    const rawContent: string = openaiData.choices?.[0]?.message?.content ?? '';

    // Strip any accidental markdown fences
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();

    gradeResult = JSON.parse(cleaned) as GradeResult;

    // Ensure nota_total is correct sum
    gradeResult.nota_total =
      (gradeResult.c1 ?? 0) + (gradeResult.c2 ?? 0) + (gradeResult.c3 ?? 0) +
      (gradeResult.c4 ?? 0) + (gradeResult.c5 ?? 0);

  } catch (e) {
    console.error('[grade-essay] parse/fetch error:', e);
    return NextResponse.json(
      { error: 'Erro ao processar a resposta da IA.' },
      { status: 500 },
    );
  }

  // ── Save to Supabase (best-effort) ─────────────────────────────────────────
  try {
    await serverClient
      .from('essay_submissions')
      .insert({
        user_id:        user.id,
        tema,
        texto,
        nota_total:     gradeResult.nota_total,
        feedback_json:  gradeResult,
        created_at:     new Date().toISOString(),
      });
  } catch {
    // Table may not exist yet — non-blocking
  }

  return NextResponse.json(gradeResult);
}
