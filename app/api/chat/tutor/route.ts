/**
 * POST /api/chat/tutor
 *
 * AiPro+ specialist tutor chat using the OpenAI Responses API.
 *
 * - Model      : gpt-4o-mini
 * - Tools      : file_search against a per-subject vector store.
 *                Vector store ID is resolved automatically from lib/tutor-config.ts
 *                via process.env[SUBJECT_VECTOR_STORE_ID], falling back to
 *                OPENAI_VECTOR_STORE_ID. No manual switch needed.
 * - Continuity : previous_response_id is echoed back to the client and must be
 *                sent on every subsequent turn to preserve conversation context.
 * - Persona    : injected server-side from lib/tutor-config.ts — never exposed
 *                to the client.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { fetchUserPlan } from '@/lib/plan';
import { getTutorBySubject, getTutorById, getVectorStoreId } from '@/lib/tutor-config';

export const runtime = 'nodejs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  // ── Plan check ──────────────────────────────────────────────────────────────
  const planInfo = await fetchUserPlan(user.id);
  if (planInfo.plan !== 'proai_plus') {
    return NextResponse.json({ error: 'Recurso exclusivo do plano AiPro+.' }, { status: 403 });
  }

  // ── Payload ─────────────────────────────────────────────────────────────────
  let tutorId:            string;
  let userMessage:        string;
  let deckTitle:          string;
  let subjectTitle:       string;
  let previousResponseId: string | undefined;

  try {
    const body         = await req.json();
    tutorId            = (body.tutor_id      ?? '').trim();
    userMessage        = (body.message       ?? '').trim();
    deckTitle          = (body.deck_title    ?? '').trim();
    subjectTitle       = (body.subject_title ?? '').trim();
    previousResponseId = body.previous_response_id ?? undefined;
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  if (!userMessage) {
    return NextResponse.json({ error: 'message é obrigatório.' }, { status: 400 });
  }

  // ── Resolve tutor from tutor-config (single source of truth) ────────────────
  const tutor =
    (tutorId      ? getTutorById(tutorId)             : null) ??
    (subjectTitle ? getTutorBySubject(subjectTitle)   : null) ??
    (deckTitle    ? getTutorBySubject(deckTitle)       : null);

  if (!tutor) {
    return NextResponse.json({ error: 'Tutor não encontrado para essa matéria.' }, { status: 400 });
  }

  // ── First-turn context injection ─────────────────────────────────────────────
  const input = (!previousResponseId && deckTitle)
    ? `[Contexto: O aluno está estudando o deck "${deckTitle}"]. Mensagem: ${userMessage}`
    : userMessage;

  // ── Vector store (auto-resolved from envKey) ─────────────────────────────────
  const vectorStoreId = getVectorStoreId(tutor);
  const tools: OpenAI.Responses.ResponseCreateParams['tools'] = vectorStoreId
    ? [{ type: 'file_search', vector_store_ids: [vectorStoreId] }]
    : [];

  // ── Call OpenAI Responses API ─────────────────────────────────────────────────
  try {
    const response = await openai.responses.create({
      model:        'gpt-4o-mini',
      instructions: tutor.prompt,
      tools,
      input,
      ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
    });

    const text = (response as unknown as { output_text?: string }).output_text ?? '';

    return NextResponse.json({
      text,
      previous_response_id: (response as unknown as { id: string }).id,
    });

  } catch (e: unknown) {
    console.error('[/api/chat/tutor] error:', e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Erro na consulta: ${msg}` }, { status: 500 });
  }
}
