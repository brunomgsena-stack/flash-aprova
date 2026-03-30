/**
 * POST /api/checkout
 *
 * Cria uma cobrança no AbacatePay e retorna o link de pagamento.
 * Não requer conta no Supabase — o usuário ainda não existe.
 *
 * Body: { email: string; name?: string; planId: 'flash' | 'proai_plus' }
 * Resposta: { url: string }
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// ── Configuração de planos ─────────────────────────────────────────────────────
const PLAN_CONFIG: Record<string, {
  priceCents:         number;
  productName:        string;
  productDescription: string;
}> = {
  flash: {
    priceCents:         59700,
    productName:        'FlashAprova Aceleração',
    productDescription: 'Flashcards SRS ilimitados + Dashboard — Acesso até ENEM 2026',
  },
  proai_plus: {
    priceCents:         69700,
    productName:        'FlashAprova Panteão Elite',
    productDescription: 'Arsenal completo IA: 10 Tutores Especialistas, Prof. Norma, Storytelling — 2 anos',
  },
};

// ── Config AbacatePay ─────────────────────────────────────────────────────────
const ABACATE_API_URL = 'https://api.abacatepay.com/v1';
const ABACATE_API_KEY = process.env.ABACATEPAY_API_KEY ?? '';

interface AbacateCreateResponse {
  error: string | null;
  data?: {
    id:  string;
    url: string;
  };
}

export async function POST(req: NextRequest) {
  // ── Validação de env ──────────────────────────────────────────────────────
  if (!ABACATE_API_KEY) {
    console.error('[/api/checkout] ABACATEPAY_API_KEY não configurada.');
    return NextResponse.json({ error: 'Configuração de pagamento incompleta.' }, { status: 500 });
  }

  // ── Parse do body ─────────────────────────────────────────────────────────
  let email: string, name: string, planId: string;
  try {
    const body = await req.json() as { email?: string; name?: string; planId?: string };
    email  = (body.email  ?? '').trim().toLowerCase();
    name   = (body.name   ?? '').trim() || email.split('@')[0];
    planId = (body.planId ?? 'proai_plus').trim();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'E-mail inválido.' }, { status: 422 });
  }

  const plan = PLAN_CONFIG[planId];
  if (!plan) {
    return NextResponse.json({ error: 'Plano inválido.' }, { status: 422 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://flashaprova.app';

  // ── Cria cobrança no AbacatePay ───────────────────────────────────────────
  let abacateRes: Response;
  try {
    abacateRes = await fetch(`${ABACATE_API_URL}/billing/create`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${ABACATE_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        frequency:     'ONE_TIME',
        methods:       ['PIX'],
        externalId:    email,
        returnUrl:     `${baseUrl}/dashboard?upgrade=success`,
        completionUrl: `${baseUrl}/dashboard`,
        products: [{
          externalId:  planId,                    // 'flash' ou 'proai_plus' — lido no webhook
          name:        plan.productName,
          description: plan.productDescription,
          quantity:    1,
          price:       plan.priceCents,
        }],
        customer: {
          name,
          email,
          cellphone: '',
          taxId: { number: '', type: 'CPF' },
        },
      }),
    });
  } catch (e: unknown) {
    console.error('[/api/checkout] Falha ao contactar AbacatePay:', e);
    return NextResponse.json({ error: 'Serviço de pagamento indisponível.' }, { status: 502 });
  }

  const json = await abacateRes.json() as AbacateCreateResponse;

  if (!abacateRes.ok || json.error || !json.data?.url) {
    console.error('[/api/checkout] Erro do AbacatePay:', json);
    return NextResponse.json(
      { error: json.error ?? 'Erro ao gerar link de pagamento.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: json.data.url });
}
