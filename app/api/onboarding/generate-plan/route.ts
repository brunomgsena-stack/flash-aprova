/**
 * POST /api/onboarding/generate-plan
 *
 * Recebe as 5 respostas do quiz de setup, chama o FlashTutor (OpenAI) para gerar
 * um plano 80/20 estruturado em 4 semanas, salva em profiles e marca
 * onboarding_completed = true no user metadata (JWT).
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

// ─── Label helpers ────────────────────────────────────────────────────────────

const BASE_LABELS: Record<string, string> = {
  zero:     'começando do zero (nunca estudou sistematicamente)',
  basico:   'base básica (viu o conteúdo mas esqueceu bastante)',
  medio:    'base intermediária (sabe o básico de cada área)',
  avancado: 'base avançada (só precisa de revisão estratégica)',
};

const EXP_LABELS: Record<string, string> = {
  treineiro: 'treineiro (ainda no ensino médio)',
  primeira:  'fazendo o ENEM pela primeira vez',
  segunda:   'segunda tentativa (quer melhorar a nota)',
  veterano:  'veterano (já fez 3 vezes ou mais)',
};

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(data: {
  curso:       string;
  base:        string;
  tempo:       number;
  dificuldade: string;
  experiencia: string;
  cardsDay:    number;
}): string {
  const { curso, base, tempo, dificuldade, experiencia, cardsDay } = data;
  const baseLabel = BASE_LABELS[base] ?? base;
  const expLabel  = EXP_LABELS[experiencia] ?? experiencia;

  return `Você é o FlashTutor, especialista em TRI e aprovação no ENEM com 15 anos de experiência em preparatórios de alto desempenho.

Dados do aluno:
- Curso desejado: ${curso}
- Base de conhecimento atual: ${baseLabel}
- Horas de estudo disponíveis por dia: ${tempo}h (~${cardsDay} flashcards/dia)
- Maior área de dificuldade autodeclarada: ${dificuldade}
- Experiência com o ENEM: ${expLabel}

Com base nesses dados, crie um cronograma de estudos focado na regra 80/20. Priorize os temas de maior peso para o curso escolhido (considerando os pesos do SISU e a TRI do ENEM) e reforce as áreas de dificuldade. Retorne um JSON estruturado com os módulos sugeridos para as próximas 4 semanas.

Retorne SOMENTE o JSON válido abaixo, sem markdown, sem explicações:
{
  "prioridades": [
    { "area": "Natureza",   "peso": 35, "motivo": "explicação curta do peso para ${curso}" },
    { "area": "Matemática", "peso": 30, "motivo": "explicação curta do peso para ${curso}" },
    { "area": "Linguagens", "peso": 20, "motivo": "explicação curta do peso para ${curso}" },
    { "area": "Humanas",    "peso": 15, "motivo": "explicação curta do peso para ${curso}" }
  ],
  "semanas": [
    {
      "numero": 1,
      "tema": "Nome do tema ou objetivo da semana 1",
      "modulos": [
        { "area": "área", "topicos": ["tópico 1", "tópico 2"], "cards_sugeridos": 30, "prioridade": "alta" }
      ]
    },
    {
      "numero": 2,
      "tema": "Nome do tema ou objetivo da semana 2",
      "modulos": [
        { "area": "área", "topicos": ["tópico 1", "tópico 2"], "cards_sugeridos": 30, "prioridade": "media" }
      ]
    },
    {
      "numero": 3,
      "tema": "Nome do tema ou objetivo da semana 3",
      "modulos": [
        { "area": "área", "topicos": ["tópico 1"], "cards_sugeridos": 25, "prioridade": "media" }
      ]
    },
    {
      "numero": 4,
      "tema": "Revisão e consolidação",
      "modulos": [
        { "area": "área", "topicos": ["revisão geral"], "cards_sugeridos": 20, "prioridade": "baixa" }
      ]
    }
  ],
  "pontos_criticos": [
    "tópico de maior impacto 1 para ${curso} no ENEM",
    "tópico de maior impacto 2 para ${curso} no ENEM",
    "tópico de maior impacto 3 para ${curso} no ENEM"
  ],
  "meta_diaria_cards": ${cardsDay},
  "meta_semanal_cards": ${cardsDay * 7},
  "horas_por_dia": ${tempo},
  "dica_tutor": "Mensagem motivacional e personalizada de 2-3 frases, direta ao ponto, mencionando o curso ${curso} e a metodologia 80/20. Deve soar como um mentor que acredita no aluno."
}

Regras críticas:
- Os pesos em "prioridades" devem somar exatamente 100
- Priorize áreas de dificuldade (${dificuldade}) e as mais cobradas no ENEM para ${curso}
- A semana 1 deve focar no diagnóstico e na área de maior dificuldade
- A semana 4 deve ser de revisão e simulado
- pontos_criticos: liste os 3 tópicos de MAIOR impacto na nota final para ${curso}
- Responda SOMENTE com o JSON válido`;
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

  const { curso, base, tempo, dificuldade, experiencia } = body as {
    curso:       string;
    base:        string;
    tempo:       number;
    dificuldade: string;
    experiencia: string;
  };

  const cardsDay = tempo <= 2 ? 25 : tempo <= 4 ? 50 : tempo <= 6 ? 75 : 100;

  // ── PASSO 1 (CRÍTICO): gravar onboarding_completed = true PRIMEIRO ────────
  // Usa RPC com SECURITY DEFINER — ignora RLS, sempre grava independente de
  // como o JWT foi resolvido no Route Handler. Não depende de SERVICE_ROLE_KEY.
  // Se isso falhar, não há razão para continuar — retorna 500 imediatamente.
  console.log('[generate-plan] PASSO 1 — user.id:', user.id);
  const { error: completionErr } = await serverClient.rpc('complete_onboarding');

  if (completionErr) {
    console.error('[generate-plan] ERRO CRÍTICO — rpc complete_onboarding:', completionErr.message, completionErr);
    return NextResponse.json(
      { error: `Erro ao finalizar onboarding: ${completionErr.message}` },
      { status: 500 },
    );
  }
  console.log('[generate-plan] ✅ onboarding_completed = true gravado no banco.');

  // ── PASSO 2: gerar plano via FlashTutor (best-effort) ─────────────────────
  let plan: Record<string, unknown>;
  try {
    const completion = await openai.chat.completions.create({
      model:           'gpt-4o-mini',
      messages:        [{ role: 'user', content: buildPrompt({ curso, base, tempo, dificuldade, experiencia, cardsDay }) }],
      response_format: { type: 'json_object' },
      temperature:     0.4,
    });
    plan = JSON.parse(completion.choices[0].message.content ?? '{}') as Record<string, unknown>;
    console.log('[generate-plan] ✅ Plano gerado pela OpenAI.');
  } catch (e) {
    console.warn('[generate-plan] OpenAI falhou, usando plano fallback:', e);
    plan = {
      prioridades: [
        { area: 'Natureza',   peso: 25, motivo: 'Base do ENEM' },
        { area: 'Matemática', peso: 25, motivo: 'Alta pontuação' },
        { area: 'Linguagens', peso: 25, motivo: 'Redação + Português' },
        { area: 'Humanas',    peso: 25, motivo: 'Interdisciplinaridade' },
      ],
      semanas: [
        { numero: 1, tema: 'Diagnóstico', modulos: [] },
        { numero: 2, tema: 'Reforço',     modulos: [] },
        { numero: 3, tema: 'Consolidação', modulos: [] },
        { numero: 4, tema: 'Revisão',     modulos: [] },
      ],
      pontos_criticos:   ['Redação', 'Matemática Básica', 'Ciências da Natureza'],
      meta_diaria_cards: cardsDay,
      meta_semanal_cards: cardsDay * 7,
      horas_por_dia:     tempo,
      dica_tutor:        `Foco em ${curso}! Cada flashcard revisado é um ponto a mais na sua aprovação. 🚀`,
    };
  }

  // ── PASSO 3: salvar plano + dados do perfil (best-effort, admin ou RLS) ───
  // Tenta com admin client primeiro (salva plano JSON completo).
  // Se SERVICE_ROLE_KEY não estiver configurado, tenta via RLS sem o plano.
  try {
    const admin = makeAdmin();
    const { error: upsertErr } = await admin.from('profiles').upsert(
      {
        id:                  user.id,
        target_course:       curso,
        daily_card_goal:     cardsDay,
        daily_hours:         tempo,
        difficulty_subjects: [dificuldade],
        ai_study_plan:       plan,
        study_plan_raw:      plan,
        onboarding_completed: true,   // garante mesmo se upsert recria a row
      },
      { onConflict: 'id' },
    );
    if (upsertErr) {
      console.warn('[generate-plan] admin upsert (non-fatal):', upsertErr.message);
    } else {
      // Atualiza JWT metadata (non-fatal)
      const admin2 = makeAdmin();
      const { error: metaErr } = await admin2.auth.admin.updateUserById(user.id, {
        user_metadata: { onboarding_completed: true },
      });
      if (metaErr) console.warn('[generate-plan] updateUserById (non-fatal):', metaErr.message);
      else console.log('[generate-plan] ✅ JWT metadata atualizado.');
    }
  } catch (adminErr) {
    console.warn('[generate-plan] Admin client indisponível (SERVICE_ROLE_KEY?):', adminErr);
    // Salva apenas os campos básicos via RLS (sem plano JSON — OK por ora)
    await serverClient.from('profiles').update({
      target_course:    curso,
      daily_card_goal:  cardsDay,
      daily_hours:      tempo,
    }).eq('id', user.id);
  }

  return NextResponse.json({ ok: true, plan });
}
