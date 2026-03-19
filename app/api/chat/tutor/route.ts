/**
 * POST /api/chat/tutor
 *
 * Handles conversational turns with AiPro+ specialist tutors.
 *
 * For tutors with a workflow_id (e.g. Dra. Clio / História), the call is
 * routed to the OpenAI Responses API using the pre-configured platform
 * workflow.  Conversation continuity is achieved via `previous_response_id`
 * which the client echoes back on every subsequent turn.
 *
 * For tutors without a workflow_id a generic gpt-4o-mini agent is used.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { fetchUserPlan } from '@/lib/plan';
import { getTutor } from '@/lib/tutor-engine';

export const runtime = 'nodejs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Generic fallback system prompt ───────────────────────────────────────────

function buildSystemPrompt(tutorName: string, specialty: string, deckTitle: string): string {
  return `Você é ${tutorName}, um especialista AiPro+ em ${specialty}.
Você está ajudando o aluno a estudar o tópico: "${deckTitle}".
Seja direto, didático e focado no ENEM. Respostas em português brasileiro.
Máximo de 3 parágrafos por resposta. Nunca quebre o personagem.`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  // ── Plan check ────────────────────────────────────────────────────────────
  const planInfo = await fetchUserPlan(user.id, user.email ?? undefined);
  if (planInfo.plan !== 'proai_plus') {
    return NextResponse.json(
      { error: 'Recurso exclusivo do plano AiPro+.' },
      { status: 403 },
    );
  }

  // ── Payload ───────────────────────────────────────────────────────────────
  let tutorId: string;
  let message: string;
  let deckTitle: string;
  let previousResponseId: string | undefined;

  try {
    const body = await req.json();
    tutorId            = (body.tutor_id            ?? '').trim();
    message            = (body.message             ?? '').trim();
    deckTitle          = (body.deck_title          ?? '').trim();
    previousResponseId = body.previous_response_id ?? undefined;
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  if (!tutorId || !message) {
    return NextResponse.json(
      { error: 'tutor_id e message são obrigatórios.' },
      { status: 400 },
    );
  }

  const tutor = getTutor(tutorId.replace(/-/g, ' ')); // match by name fallback
  const resolvedTutor = tutor ?? { name: tutorId, specialty: 'ENEM', workflow_id: undefined };

  // ── Dispatch: workflow vs generic agent ───────────────────────────────────
  try {
    if (resolvedTutor.workflow_id) {
      // ── OpenAI Responses API with platform workflow ──────────────────────
      const response = await openai.responses.create({
        model:                resolvedTutor.workflow_id as string,
        input:                message,
        ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
      });

      const text = (response as unknown as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> })
        .output_text
        ?? (response as unknown as { output?: Array<{ content?: Array<{ text?: string }> }> })
          .output?.[0]?.content?.[0]?.text
        ?? '';

      return NextResponse.json({
        text,
        previous_response_id: (response as unknown as { id: string }).id,
      });

    } else {
      // ── Generic gpt-4o-mini agent (tutors without a workflow) ────────────
      const params: OpenAI.Responses.ResponseCreateParamsNonStreaming = {
        model:        'gpt-4o-mini',
        instructions: buildSystemPrompt(
          resolvedTutor.name,
          resolvedTutor.specialty,
          deckTitle,
        ),
        input: message,
        ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
      };

      const response = await openai.responses.create(params);

      const text = (response as unknown as { output_text?: string })
        .output_text ?? '';

      return NextResponse.json({
        text,
        previous_response_id: (response as unknown as { id: string }).id,
      });
    }

  } catch (e: unknown) {
    console.error('[/api/chat/tutor] error:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Erro na consulta: ${message}` }, { status: 500 });
  }
}
