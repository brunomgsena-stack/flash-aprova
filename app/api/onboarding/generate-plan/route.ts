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
  // ══ WRAPPER GLOBAL ══════════════════════════════════════════════════════════
  // Captura qualquer exceção JS não tratada (ex: env var ausente, cliente
  // Supabase lançando antes de retornar { error }, etc.) e devolve um body
  // JSON legível em vez do {} vazio que o Next.js retorna por padrão.
  try {
    return await handlePost(req);
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('[generate-plan] ⚠️ EXCEÇÃO NÃO CAPTURADA:', err.message, '\n', err.stack);
    return NextResponse.json(
      { error: err.message, detail: err.stack ?? String(e) },
      { status: 500 },
    );
  }
}

async function handlePost(req: NextRequest): Promise<Response> {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
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

  // ── PASSO 1 (CRÍTICO): gravar onboarding_completed = true ───────────────────
  //
  // Cadeia de 3 tentativas em ordem de segurança:
  //   1. serverClient.rpc — usa a sessão do cookie, não depende de SERVICE_ROLE_KEY
  //   2. admin UPDATE     — usa service role, mas só se a env var existir
  //   3. admin INSERT     — cria a row se não existir, com campos mínimos seguros
  //
  // BYPASS DE EMERGÊNCIA: se todas as 3 falharem, logamos e continuamos.
  // O redirecionamento acontece de qualquer forma. Sem bypass, o usuário
  // ficaria preso no setup indefinidamente mesmo com o banco inacessível.
  //
  // NÃO enviamos school_id nem class_id — são colunas B2B nullable.
  // Enviá-las como null explicitamente quebraria constraints NOT NULL se existirem.

  console.log('[generate-plan] PASSO 1 — user.id:', user.id);
  let onboardingMarked = false;

  // Tentativa 1: RPC via serverClient (sem depender de SERVICE_ROLE_KEY)
  try {
    const { error: rpcErr } = await serverClient.rpc('complete_onboarding');
    console.log('Erro do Supabase (rpc):', rpcErr);
    if (!rpcErr) {
      onboardingMarked = true;
      console.log('[generate-plan] ✅ PASSO 1 via RPC.');
    } else {
      console.warn('[generate-plan] RPC falhou:', rpcErr.message, rpcErr.code);
    }
  } catch (rpcEx) {
    console.warn('[generate-plan] RPC lançou exceção:', String(rpcEx));
  }

  // Tentativa 2: admin UPDATE (SERVICE_ROLE_KEY) — só se RPC não funcionou
  if (!onboardingMarked && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = makeAdmin();
      const { error: updateErr } = await admin
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      console.log('Erro do Supabase (admin update):', updateErr);

      if (!updateErr) {
        // Confirma que a row existia e foi atualizada
        const { data: verify } = await admin
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .maybeSingle();

        if (verify?.onboarding_completed === true) {
          onboardingMarked = true;
          console.log('[generate-plan] ✅ PASSO 1 via admin UPDATE.');
        } else {
          // Row não existia — Tentativa 3: INSERT mínimo seguro
          console.warn('[generate-plan] Row não existe, tentando INSERT. user.id:', user.id);
          const { error: insertErr } = await admin
            .from('profiles')
            .insert({ id: user.id, onboarding_completed: true, role: 'student' });

          console.log('Erro do Supabase (admin insert):', insertErr);

          if (!insertErr) {
            onboardingMarked = true;
            console.log('[generate-plan] ✅ PASSO 1 via admin INSERT.');
          } else {
            console.error('[generate-plan] INSERT falhou:', {
              message: insertErr.message,
              code:    insertErr.code,  // 23502=NOT NULL | 23503=FK | 42703=col inexistente
              details: insertErr.details,
              hint:    insertErr.hint,
            });
          }
        }
      } else {
        console.error('[generate-plan] admin UPDATE falhou:', {
          message: updateErr.message,
          code:    updateErr.code,
          details: updateErr.details,
          hint:    updateErr.hint,
        });
      }
    } catch (adminEx) {
      console.error('[generate-plan] admin client lançou exceção:', String(adminEx));
    }
  }

  // Bypass de emergência: se nada funcionou, loga e continua
  if (!onboardingMarked) {
    console.error(
      '[generate-plan] ⚠️ BYPASS: todas as tentativas de gravar onboarding_completed falharam.',
      '  → Verifique: SUPABASE_SERVICE_ROLE_KEY está definida? A função complete_onboarding existe?',
      '  → Se class_id NOT NULL: ALTER TABLE profiles ALTER COLUMN class_id DROP NOT NULL;',
    );
  }

  // ── PASSO 2: gerar plano via FlashTutor (best-effort) ──────────────────────
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
        { numero: 1, tema: 'Diagnóstico',  modulos: [] },
        { numero: 2, tema: 'Reforço',      modulos: [] },
        { numero: 3, tema: 'Consolidação', modulos: [] },
        { numero: 4, tema: 'Revisão',      modulos: [] },
      ],
      pontos_criticos:    ['Redação', 'Matemática Básica', 'Ciências da Natureza'],
      meta_diaria_cards:  cardsDay,
      meta_semanal_cards: cardsDay * 7,
      horas_por_dia:      tempo,
      dica_tutor:         `Foco em ${curso}! Cada flashcard revisado é um ponto a mais na sua aprovação. 🚀`,
    };
  }

  // ── PASSO 3: salvar plano + dados do perfil (best-effort) ──────────────────
  // Nunca retorna erro — falhas aqui não bloqueiam o onboarding.
  // Não envia school_id nem class_id (nullable para B2C).
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = makeAdmin();
      const { error: upsertErr } = await admin.from('profiles').upsert(
        {
          id:                   user.id,
          role:                 'student',
          target_course:        curso,
          daily_card_goal:      cardsDay,
          daily_hours:          tempo,
          difficulty_subjects:  [dificuldade],
          ai_study_plan:        plan,
          onboarding_completed: true,
        },
        { onConflict: 'id' },
      );

      if (upsertErr) {
        console.error('[generate-plan] upsert de perfil (non-fatal):', {
          message: upsertErr.message,
          code:    upsertErr.code,
          details: upsertErr.details,
          hint:    upsertErr.hint,
        });
      } else {
        const admin2 = makeAdmin();
        const { error: metaErr } = await admin2.auth.admin.updateUserById(user.id, {
          user_metadata: { onboarding_completed: true },
        });
        if (metaErr) console.warn('[generate-plan] updateUserById (non-fatal):', metaErr.message);
        else         console.log('[generate-plan] ✅ JWT metadata atualizado.');
      }
    } catch (p3Err) {
      console.warn('[generate-plan] PASSO 3 lançou exceção (non-fatal):', String(p3Err));
    }
  }

  return NextResponse.json({ ok: true, plan });
}
