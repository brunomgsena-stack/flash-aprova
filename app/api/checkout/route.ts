/**
 * POST /api/checkout
 *
 * Fluxo Asaas:
 *   1. Autentica o utilizador via Supabase session (cookies SSR)
 *   2. Resolve a URL do payment link do Asaas pelo planId
 *   3. Retorna { url } para redirecionar o browser (com email como externalReference)
 *
 * Body: { planId: 'aceleracao' | 'panteao_elite'; email?: string; name?: string }
 * Resposta: { url: string }
 *
 * Variáveis de ambiente necessárias:
 *   ASAAS_PAYMENT_LINK_URL_ACELERACAO   — URL do link de pagamento do plano Aceleração
 *   ASAAS_PAYMENT_LINK_URL_PANTEAO_ELITE — URL do link de pagamento do plano Panteão Elite
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// ── Configuração de planos ─────────────────────────────────────────────────────

const PLAN_LINK_ENV: Record<string, string> = {
  aceleracao:    'ASAAS_PAYMENT_LINK_URL_ACELERACAO',
  panteao_elite: 'ASAAS_PAYMENT_LINK_URL_PANTEAO_ELITE',
};

// ── Handler principal ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Body
  let planId: string, bodyEmail: string | undefined;
  try {
    const b = await req.json() as { planId?: string; email?: string; name?: string };
    planId    = (b.planId ?? 'panteao_elite').trim();
    bodyEmail = b.email?.trim().toLowerCase() || undefined;
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const envKey = PLAN_LINK_ENV[planId];
  if (!envKey) {
    return NextResponse.json({ error: 'Plano inválido.' }, { status: 422 });
  }

  const paymentLinkUrl = process.env[envKey];
  if (!paymentLinkUrl) {
    console.error(`[checkout] ${envKey} não configurado.`);
    return NextResponse.json({ error: 'Configuração de pagamento incompleta.' }, { status: 500 });
  }

  // Obtém e-mail do usuário autenticado se não veio no body
  let email = bodyEmail ?? '';
  if (!email) {
    try {
      const serverClient = await createClient();
      const { data: { user } } = await serverClient.auth.getUser();
      email = user?.email ?? '';
    } catch {
      // não-fatal: segue sem e-mail
    }
  }

  // Monta URL com externalReference para o webhook do Asaas identificar o comprador
  let url = paymentLinkUrl;
  if (email) {
    const separator = paymentLinkUrl.includes('?') ? '&' : '?';
    url = `${paymentLinkUrl}${separator}externalReference=${encodeURIComponent(email)}`;
  }

  console.log(`[checkout] Redirecionando para Asaas. planId=${planId} email=${email || '(anon)'}`);
  return NextResponse.json({ url });
}
