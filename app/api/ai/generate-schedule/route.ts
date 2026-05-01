/**
 * POST /api/ai/generate-schedule
 *
 * Gera um cronograma semanal inteligente com base no desempenho real do aluno.
 * Lê user_progress para calcular cobertura e taxa de erro por matéria,
 * chama o FlashTutor (OpenAI) e salva o resultado em profiles.ai_study_plan.
 *
 * Validade: 7 dias — o campo generated_at indica quando foi gerado.
 *
 * Threshold mínimo: 10 cards revisados para gerar um plano significativo.
 */

import { NextResponse }    from 'next/server';
import OpenAI              from 'openai';
import { createClient }    from '@/lib/supabase/server';
import { createClient as adminSupa } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const MIN_REVIEWS_REQUIRED = 10;

function makeAdmin() {
  return adminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function sanitizeForPrompt(value: unknown): string {
  if (typeof value !== 'string') return String(value ?? '');
  return value
    .replace(/[<>{}\\]/g, '') // remove chars used in prompt injection
    .slice(0, 200)             // hard cap
    .trim();
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SubjectStat = {
  subject:    string;
  area:       string;
  total:      number;   // total de cards no subject
  reviewed:   number;   // cards com entrada em user_progress
  coverage:   number;   // reviewed / total (0–1)
  lapses:     number;   // total de erros acumulados
  errorRate:  number;   // lapses / reviewed (0–n), normalizado para 0–1 no prompt
};

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(
  curso:       string,
  horasPerDia: number,
  stats:       SubjectStat[],
  firstName:   string,
): string {
  const sorted = [...stats].sort((a, b) => a.coverage - b.coverage);

  const statsText = sorted.map(s =>
    `- ${sanitizeForPrompt(s.subject)} (${sanitizeForPrompt(s.area)}): cobertura ${Math.round(s.coverage * 100)}%, taxa de erro ${Math.round(s.errorRate * 100)}%, cards revisados ${s.reviewed}/${s.total}`
  ).join('\n');

  // Identify weakest and strongest for the feedback line
  const weakest   = sanitizeForPrompt(sorted[0]?.subject ?? '');
  const strongest = sanitizeForPrompt(sorted[sorted.length - 1]?.subject ?? '');

  const safeCurso     = sanitizeForPrompt(curso);
  const safeFirstName = sanitizeForPrompt(firstName);

  return `Você é o FlashTutor, especialista em aprovação no ENEM com metodologia 80/20.

Aluno: ${safeFirstName}
Curso alvo: ${safeCurso}
Horas disponíveis por dia: ${horasPerDia}h

DESEMPENHO REAL DO ALUNO (ordenado do mais fraco para o mais forte):
${statsText}

Matéria mais fraca (menor cobertura): ${weakest}
Matéria mais forte (maior cobertura): ${strongest}

Com base nesses dados de desempenho real, crie um cronograma adaptativo para os próximos 7 dias.
Priorize matérias com MENOR cobertura e MAIOR taxa de erro. Respeite o peso do curso alvo.

Retorne SOMENTE o JSON válido abaixo, sem markdown:
{
  "prioridades": [
    { "area": "Natureza",   "peso": 35, "motivo": "explicação curta baseada nos dados reais" },
    { "area": "Matemática", "peso": 30, "motivo": "explicação curta baseada nos dados reais" },
    { "area": "Linguagens", "peso": 20, "motivo": "explicação curta baseada nos dados reais" },
    { "area": "Humanas",    "peso": 15, "motivo": "explicação curta baseada nos dados reais" }
  ],
  "semanas": [
    {
      "numero": 1,
      "tema": "Foco nas lacunas críticas desta semana",
      "modulos": [
        { "area": "área", "topicos": ["matéria prioritária 1", "matéria prioritária 2"], "cards_sugeridos": 30, "prioridade": "alta" }
      ]
    }
  ],
  "pontos_criticos": [
    "matéria com menor cobertura",
    "matéria com maior taxa de erro",
    "matéria de maior peso para ${safeCurso}"
  ],
  "meta_diaria_cards": ${Math.round(horasPerDia * 25)},
  "meta_semanal_cards": ${Math.round(horasPerDia * 25 * 7)},
  "horas_por_dia": ${horasPerDia},
  "dica_tutor": "Mensagem geral de 2-3 frases motivacional para ${safeFirstName} com base nos dados reais.",
  "feedback_tutor": "Frase CURTA e DIRETA com máximo 150 caracteres. Dirija-se a ${safeFirstName} pelo nome. Mencione UMA matéria específica: ou onde ele está tropeçando (${weakest}) ou onde evoluiu bem (${strongest}). Tom: mentor direto e honesto, não robótico. Ex: '${safeFirstName}, ${weakest} está sangrando. Reforço garantido na quarta. Bora fechar essa lacuna!'"
}

Regras:
- Os pesos em "prioridades" devem somar exatamente 100
- Inclua apenas 1 semana em "semanas" (cronograma da próxima semana)
- pontos_criticos: as 3 matérias de maior impacto AGORA com base nos dados reais
- feedback_tutor: máximo 150 caracteres, menciona o nome ${safeFirstName} e uma matéria real dos dados
- Responda SOMENTE com o JSON válido`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST() {
  try {
    const serverClient = await createClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    // ── 1. Buscar dados de progresso com info do subject ─────────────────────
    const [
      { data: progressRows },
      { data: allCards },
      { data: profile },
    ] = await Promise.all([
      serverClient
        .from('user_progress')
        .select('card_id, interval_days, lapses')
        .eq('user_id', user.id),
      serverClient
        .from('cards')
        .select('id, decks(subject_id, subjects(title, category))'),
      serverClient
        .from('profiles')
        .select('target_course, daily_hours, full_name')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    const rows = progressRows ?? [];

    // Threshold mínimo
    if (rows.length < MIN_REVIEWS_REQUIRED) {
      return NextResponse.json(
        { error: 'insufficient_data', reviewed: rows.length, required: MIN_REVIEWS_REQUIRED },
        { status: 422 },
      );
    }

    // ── 2. Normalizar cards ──────────────────────────────────────────────────
    type NormCard = { id: string; subjectId: string; subjectTitle: string; area: string };
    const normCards: NormCard[] = [];

    for (const raw of (allCards ?? []) as Array<{ id: string; decks: unknown }>) {
      const rd = Array.isArray(raw.decks) ? (raw.decks[0] ?? null) : raw.decks as { subject_id: string; subjects: unknown } | null;
      if (!rd) continue;
      const d  = rd as { subject_id: string; subjects: unknown };
      const rs = Array.isArray(d.subjects) ? (d.subjects[0] ?? null) : d.subjects as { title: string; category: string | null } | null;
      if (!rs) continue;
      const s  = rs as { title: string; category: string | null };
      const area = mapCategory(s.category);
      normCards.push({ id: raw.id, subjectId: d.subject_id, subjectTitle: s.title, area });
    }

    // ── 3. Calcular stats por subject ────────────────────────────────────────
    const cardSubject = new Map(normCards.map(c => [c.id, { subjectId: c.subjectId, subjectTitle: c.subjectTitle, area: c.area }]));

    // total por subject
    const totals = new Map<string, { title: string; area: string; total: number }>();
    for (const c of normCards) {
      const ex = totals.get(c.subjectId);
      if (ex) ex.total++;
      else totals.set(c.subjectId, { title: c.subjectTitle, area: c.area, total: 1 });
    }

    // reviewed + lapses por subject
    const reviewed  = new Map<string, number>();
    const lapsesMap = new Map<string, number>();
    for (const row of rows) {
      const meta = cardSubject.get(row.card_id);
      if (!meta) continue;
      reviewed.set(meta.subjectId,  (reviewed.get(meta.subjectId)  ?? 0) + 1);
      lapsesMap.set(meta.subjectId, (lapsesMap.get(meta.subjectId) ?? 0) + (row.lapses ?? 0));
    }

    const stats: SubjectStat[] = Array.from(totals.entries())
      .filter(([, v]) => v.total >= 5)    // ignorar subjects com < 5 cards
      .map(([subjectId, v]) => {
        const rev        = reviewed.get(subjectId)  ?? 0;
        const lapses     = lapsesMap.get(subjectId) ?? 0;
        const coverage   = v.total > 0 ? rev / v.total : 0;
        const errorRate  = rev > 0 ? Math.min(lapses / rev, 1) : 0;
        return { subject: v.title, area: v.area, total: v.total, reviewed: rev, coverage, lapses, errorRate };
      });

    if (stats.length === 0) {
      return NextResponse.json(
        { error: 'insufficient_data', reviewed: rows.length, required: MIN_REVIEWS_REQUIRED },
        { status: 422 },
      );
    }

    // ── 4. Chamar OpenAI ─────────────────────────────────────────────────────
    const curso       = profile?.target_course ?? 'ENEM';
    const horasPerDia = Math.min(profile?.daily_hours ?? 2, 8);
    const firstName   = ((profile as { full_name?: string | null } | null)?.full_name ?? '').trim().split(/\s+/)[0] || 'você';

    let plan: Record<string, unknown>;
    try {
      const completion = await openai.chat.completions.create({
        model:           'gpt-4o-mini',
        messages:        [{ role: 'user', content: buildPrompt(curso, horasPerDia, stats, firstName) }],
        response_format: { type: 'json_object' },
        temperature:     0.3,
      });
      plan = JSON.parse(completion.choices[0].message.content ?? '{}') as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Erro ao gerar plano. Tente novamente.' }, { status: 502 });
    }

    // Adicionar timestamp de geração
    plan.generated_at    = new Date().toISOString();
    plan.generated_from  = 'performance_data';

    // ── 5. Salvar em profiles.ai_study_plan ──────────────────────────────────
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = makeAdmin();
      await admin
        .from('profiles')
        .update({ ai_study_plan: plan })
        .eq('id', user.id);
    }

    return NextResponse.json({ ok: true, plan });
  } catch (e) {
    console.error('[generate-schedule] erro:', e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapCategory(category: string | null): string {
  if (!category) return 'Outras';
  const c = category.toLowerCase();
  if (c.includes('natureza') || c.includes('biolog') || c.includes('físic') || c.includes('quím')) return 'Natureza';
  if (c.includes('humana') || c.includes('histór') || c.includes('geograf') || c.includes('filosof') || c.includes('sociolog')) return 'Humanas';
  if (c.includes('matemát')) return 'Matemática';
  if (c.includes('linguag') || c.includes('portugu') || c.includes('literatur') || c.includes('inglês')) return 'Linguagens';
  if (c.includes('redação')) return 'Redação';
  return category;
}
