/**
 * POST /api/asaas/create-payment
 *
 * Cria uma cobrança no Asaas via API (não usa links estáticos).
 * Fluxo:
 *   1. Recebe { email, name, planId }
 *   2. Busca ou cria o customer no Asaas pelo e-mail
 *   3. Cria cobrança via POST /payments com externalReference=email
 *   4. Retorna { paymentUrl } para redirecionar o browser
 *
 * Variáveis de ambiente necessárias:
 *   ASAAS_API_KEY   — chave de acesso à API Asaas
 *   ASAAS_API_URL   — (opcional) base URL; padrão: https://api.asaas.com/v3
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// ── Configuração dos planos ───────────────────────────────────────────────────

type PlanId = 'aceleracao' | 'panteao_elite';

const PLANS: Record<PlanId, { value: number; installmentCount: number; installmentValue: number; name: string }> = {
  aceleracao: {
    value:            710,
    installmentCount: 12,
    installmentValue: 59.16,
    name:             'Protocolo Básico',
  },
  panteao_elite: {
    value:            797,
    installmentCount: 12,
    installmentValue: 66.41,
    name:             'Protocolo Neural',
  },
};

// ── Helpers Asaas ─────────────────────────────────────────────────────────────

function asaasHeaders(apiKey: string) {
  return {
    'Content-Type':  'application/json',
    'access_token':  apiKey,
    'User-Agent':    'flashaprova/1.0',
  };
}

async function findOrCreateCustomer(
  baseUrl: string,
  apiKey:  string,
  email:   string,
  name:    string,
): Promise<string> {
  // 1. Tenta encontrar customer existente pelo e-mail
  const searchRes = await fetch(
    `${baseUrl}/customers?email=${encodeURIComponent(email)}&limit=1`,
    { headers: asaasHeaders(apiKey) },
  );

  if (searchRes.ok) {
    const searchData = (await searchRes.json()) as { data?: { id: string }[] };
    const existing = searchData.data?.[0];
    if (existing?.id) {
      console.log(`[create-payment] Customer existente encontrado: ${existing.id}`);
      return existing.id;
    }
  }

  // 2. Cria novo customer
  const createRes = await fetch(`${baseUrl}/customers`, {
    method:  'POST',
    headers: asaasHeaders(apiKey),
    body:    JSON.stringify({ name, email }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Falha ao criar customer no Asaas: ${createRes.status} — ${err}`);
  }

  const newCustomer = (await createRes.json()) as { id: string };
  console.log(`[create-payment] Novo customer criado: ${newCustomer.id}`);
  return newCustomer.id;
}

async function createPayment(
  baseUrl:    string,
  apiKey:     string,
  customerId: string,
  plan:       typeof PLANS[PlanId],
  planId:     PlanId,
  email:      string,
): Promise<string> {
  // Vencimento: 7 dias a partir de hoje
  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]; // 'YYYY-MM-DD'

  const body = {
    customer:          customerId,
    billingType:       'UNDEFINED',   // cliente escolhe o meio de pagamento no checkout
    value:             plan.value,
    dueDate,
    description:       plan.name,
    externalReference: email,         // usado pelo webhook para identificar o comprador
    installmentCount:  plan.installmentCount,
    installmentValue:  plan.installmentValue,
  };

  const res = await fetch(`${baseUrl}/payments`, {
    method:  'POST',
    headers: asaasHeaders(apiKey),
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Falha ao criar cobrança no Asaas: ${res.status} — ${err}`);
  }

  const payment = (await res.json()) as { invoiceUrl?: string; bankSlipUrl?: string; id?: string };

  const paymentUrl = payment.invoiceUrl ?? payment.bankSlipUrl;
  if (!paymentUrl) {
    throw new Error(`Asaas não retornou URL de pagamento. planId=${planId} paymentId=${payment.id}`);
  }

  console.log(`[create-payment] Cobrança criada. planId=${planId} paymentId=${payment.id} url=${paymentUrl}`);
  return paymentUrl;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parse do body
  let email: string, name: string, planId: PlanId;
  try {
    const b = (await req.json()) as { email?: string; name?: string; planId?: string };
    email  = b.email?.trim().toLowerCase() ?? '';
    name   = b.name?.trim() ?? email.split('@')[0];
    planId = (b.planId ?? 'panteao_elite') as PlanId;
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'E-mail inválido ou ausente.' }, { status: 422 });
  }

  const plan = PLANS[planId];
  if (!plan) {
    return NextResponse.json({ error: 'Plano inválido.' }, { status: 422 });
  }

  // 2. Configuração Asaas
  const apiKey  = process.env.ASAAS_API_KEY;
  const baseUrl = process.env.ASAAS_API_URL ?? 'https://api.asaas.com/v3';

  // DEBUG temporário — remover após confirmar que funciona
  console.log('[create-payment] ENV check:', {
    ASAAS_API_KEY_exists: !!apiKey,
    ASAAS_API_KEY_length: apiKey?.length ?? 0,
    ASAAS_API_KEY_start:  apiKey?.substring(0, 10) ?? '(vazio)',
    ASAAS_API_URL:        baseUrl,
    NODE_ENV:             process.env.NODE_ENV,
  });

  if (!apiKey) {
    console.error('[create-payment] ASAAS_API_KEY não configurada.');
    return NextResponse.json({ error: 'Configuração de pagamento incompleta.' }, { status: 500 });
  }

  // 3. Busca/cria customer e cria cobrança
  try {
    const customerId = await findOrCreateCustomer(baseUrl, apiKey, email, name);
    const paymentUrl = await createPayment(baseUrl, apiKey, customerId, plan, planId, email);

    return NextResponse.json({ paymentUrl });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[create-payment] Erro:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
