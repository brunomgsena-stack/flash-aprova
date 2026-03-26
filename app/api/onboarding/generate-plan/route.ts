/**
 * POST /api/onboarding/generate-plan
 *
 * Recebe respostas do quiz de setup, chama a OpenAI para gerar um plano
 * estruturado 80/20, salva em profiles e marca onboarding_completed = true
 * no user metadata (JWT).
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI                        from 'openai';
import { createClient }              from '@/lib/supabase/server';
import { createClient as adminSupa } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function makeAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return adminSupa(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(data: {
  objetivo:     string;
  curso:        string;
  universidade: string | null;
  dificuldades: string[];
  metaDiaria:   number;
}): string {
  const { objetivo, curso, universidade, dificuldades, metaDiaria } = data;

  const objLabel = objetivo === 'enem' ? 'ENEM' : objetivo === 'vestibular' ? 'Vestibular Específico' : 'Concurso Público';
  const univStr  = universidade ? `na ${universidade}` : 'em uma boa universidade';
  const diffStr  = dificuldades.length > 0 ? dificuldades.join(', ') : 'nenhuma área específica';

  return `Você é um especialista em aprovação no ENEM e vestibulares brasileiros usando a metodologia 80/20.

Dados do aluno:
- Objetivo: ${objLabel}
- Curso desejado: ${curso} ${univStr}
- Áreas de dificuldade autodeclaradas: ${diffStr}
- Meta diária de flashcards: ${metaDiaria} cards/dia

Gere um plano de estudos personalizado em JSON com EXATAMENTE esta estrutura (sem markdown, só o JSON):
{
  "prioridades": [
    { "area": "Natureza",   "peso": 40, "motivo": "texto curto" },
    { "area": "Matemática", "peso": 30, "motivo": "texto curto" },
    { "area": "Linguagens", "peso": 20, "motivo": "texto curto" },
    { "area": "Humanas",    "peso": 10, "motivo": "texto curto" }
  ],
  "meta_semanal_cards": ${metaDiaria * 7},
  "pontos_criticos": ["ponto 1", "ponto 2", "ponto 3"],
  "dica_tutor": "Mensagem motivacional de 1-2 frases, pessoal e direta, mencionando o curso ${curso}",
  "cronograma_sugerido": {
    "Segunda": ["área 1", "área 2"],
    "Terça":   ["área 1"],
    "Quarta":  ["área 1", "área 2"],
    "Quinta":  ["área 1"],
    "Sexta":   ["área 1", "área 2"],
    "Sábado":  ["revisão geral"],
    "Domingo": ["descanso ou revisão leve"]
  }
}

Regras:
- Os pesos em "prioridades" devem somar 100
- Priorize áreas de dificuldade do aluno e as mais cobradas no ${objLabel} para ${curso}
- O cronograma deve refletir a distribuição de pesos
- Responda SOMENTE com o JSON válido, sem nenhuma explicação ou markdown`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  // Parse body
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  const { objetivo, curso, universidade, dificuldades, metaDiaria } = body as {
    objetivo:     string;
    curso:        string;
    universidade: string | null;
    dificuldades: string[];
    metaDiaria:   number;
  };

  // Generate plan
  let plan: Record<string, unknown>;
  try {
    const completion = await openai.chat.completions.create({
      model:    'gpt-4o-mini',
      messages: [{ role: 'user', content: buildPrompt({ objetivo, curso, universidade, dificuldades, metaDiaria }) }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });
    plan = JSON.parse(completion.choices[0].message.content ?? '{}') as Record<string, unknown>;
  } catch (e) {
    console.error('[generate-plan] OpenAI error:', e);
    // Fallback plan so onboarding still completes
    plan = {
      prioridades:          [
        { area: 'Natureza',   peso: 25, motivo: 'Base do ENEM' },
        { area: 'Matemática', peso: 25, motivo: 'Alta pontuação' },
        { area: 'Linguagens', peso: 25, motivo: 'Redação + Português' },
        { area: 'Humanas',    peso: 25, motivo: 'Interdisciplinaridade' },
      ],
      meta_semanal_cards:   metaDiaria * 7,
      pontos_criticos:      ['Manter consistência diária', 'Revisão espaçada', 'Simulados mensais'],
      dica_tutor:           `Foco em ${curso}! Cada card revisado é um ponto a mais na sua aprovação. 🚀`,
      cronograma_sugerido:  {},
    };
  }

  // Save to DB via admin client (bypasses RLS)
  const admin = makeAdmin();

  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id:                   user.id,
      target_course:        curso,
      target_university:    universidade ?? null,
      daily_card_goal:      metaDiaria,
      difficulty_subjects:  dificuldades,
      ai_study_plan:        plan,
      onboarding_completed: true,
    },
    { onConflict: 'id' },
  );

  if (profileError) {
    console.error('[generate-plan] profiles upsert error:', profileError.message);
    return NextResponse.json({ error: 'Erro ao salvar perfil.' }, { status: 500 });
  }

  // Mark onboarding_completed in JWT user metadata (read by middleware)
  const { error: metaError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { onboarding_completed: true },
  });

  if (metaError) {
    console.error('[generate-plan] updateUserById error:', metaError.message);
    // Non-fatal: profile was saved. Client will check DB on next load.
  }

  return NextResponse.json({ ok: true, plan });
}
