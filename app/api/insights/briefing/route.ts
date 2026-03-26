/**
 * POST /api/insights/briefing
 *
 * Recebe os dados reais do aluno e retorna um Briefing de Inteligência
 * gerado pelo FlashTutor (GPT-4o-mini) com 3 seções estruturadas.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type BriefingInput = {
  maturePct:    number;
  areaScores:   Record<string, number>;
  topLapseInfo: { deckTitle: string; area: string; lapses: number } | null;
  totalDue:     number;
  streak:       number;
  targetCourse: string | null;
};

function buildPrompt(d: BriefingInput): string {
  const areaLines = Object.entries(d.areaScores)
    .map(([area, score]) => `  - ${area}: ${score}%`)
    .join('\n') || '  (sem dados de área ainda)';

  const lapseInfo = d.topLapseInfo
    ? `Deck com mais lapsos: "${d.topLapseInfo.deckTitle}" (${d.topLapseInfo.area}, ${d.topLapseInfo.lapses} lapso(s))`
    : 'Nenhum lapse crítico identificado';

  return `Você é o FlashTutor, Diretor Pedagógico com 20 anos de experiência em aprovação no ENEM. Seu estilo é o de um briefing de inteligência militar: zero clichês, zero motivação vazia, 100% estratégia cirúrgica baseada em dados.

Dados do aluno:
- Curso-alvo: ${d.targetCourse ?? 'não informado'}
- Edital dominado (cards maduros): ${d.maturePct}%
- Cards em atraso hoje: ${d.totalDue}
- Sequência de estudos: ${d.streak} dia(s)
- Aproveitamento por área ENEM:
${areaLines}
- ${lapseInfo}

Com base nesses dados, produza um Briefing de Inteligência com EXATAMENTE 3 seções. Cada seção deve ter no máximo 2 frases. Tom: direto, estratégico, sem elogios vazios.

Retorne SOMENTE o JSON abaixo, sem markdown:
{
  "resumo_estrategico": "Um parágrafo de 1-2 frases sobre a saúde atual do plano — onde o aluno está e o que define sua posição no ranking agora.",
  "alerta_de_risco": "1-2 frases sobre o ponto de maior perigo: onde o aluno está perdendo pontos de forma silenciosa. Seja específico — cite área, deck ou comportamento.",
  "missao_do_dia": "Uma missão clara, inegociável e mensurável para hoje. Máximo 2 frases. Deve ter um verbo de ação no imperativo."
}`;
}

export async function POST(req: NextRequest) {
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as BriefingInput | null;
  if (!body) {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model:           'gpt-4o-mini',
      messages:        [{ role: 'user', content: buildPrompt(body) }],
      response_format: { type: 'json_object' },
      temperature:     0.45,
      max_tokens:      400,
    });

    const result = JSON.parse(completion.choices[0].message.content ?? '{}') as {
      resumo_estrategico: string;
      alerta_de_risco:    string;
      missao_do_dia:      string;
    };

    return NextResponse.json(result);
  } catch (e) {
    console.error('[insights/briefing] OpenAI falhou:', e);
    return NextResponse.json({ error: 'Falha ao gerar briefing.' }, { status: 500 });
  }
}
