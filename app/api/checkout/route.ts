/**
 * POST /api/checkout
 *
 * Cria uma cobrança no AbacatePay e retorna o link de pagamento.
 * Não requer conta no Supabase — o usuário ainda não existe.
 *
 * Body: { email: string; name?: string }
 * Resposta: { url: string }
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// ── Preço do plano AiPro+ em centavos (R$ 67,90) ─────────────────────────────
const PLAN_PRICE_CENTS = 6790;

// ── Config AbacatePay ─────────────────────────────────────────────────────────
const ABACATE_API_URL  = 'https://api.abacatepay.com/v1';
const ABACATE_API_KEY  = process.env.ABACATEPAY_API_KEY ?? '';

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
  let email: string, name: string;
  try {
    const body = await req.json() as { email?: string; name?: string };
    email = (body.email ?? '').trim().toLowerCase();
    name  = (body.name  ?? '').trim() || email.split('@')[0];
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'E-mail inválido.' }, { status: 422 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://flashaprova.app';

  // ── Cria cobrança no AbacatePay ───────────────────────────────────────────
  // Documentação: https://abacatepay.com/docs
  // O campo `externalId` transporta o email do lead para o webhook.
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
        externalId:    email,           // recebemos de volta no webhook para identificar o comprador
        returnUrl:     `${baseUrl}/dashboard?upgrade=success`,
        completionUrl: `${baseUrl}/dashboard`,
        products: [{
          externalId:  'aipro_plus',
          name:        'FlashAprova AiPro+',
          description: 'Acesso completo: Tutores IA, Redação, Arsenal de Estudo',
          quantity:    1,
          price:       PLAN_PRICE_CENTS,
        }],
        customer: {
          name,
          email,
          // Telefone e CPF são coletados pelo AbacatePay no checkout
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
