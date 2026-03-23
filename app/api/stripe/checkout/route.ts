/**
 * POST /api/stripe/checkout
 *
 * Cria uma Stripe Checkout Session para o plano AiPro+ e retorna a URL de pagamento.
 * Requer autenticação — apenas usuários logados podem iniciar o checkout.
 */

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  // ── Stripe config ─────────────────────────────────────────────────────────
  const priceId = process.env.STRIPE_PRICE_ID_AIPRO;
  if (!priceId) {
    console.error('[/api/stripe/checkout] STRIPE_PRICE_ID_AIPRO não configurado.');
    return NextResponse.json({ error: 'Configuração de pagamento incompleta.' }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';

  // ── Create session ────────────────────────────────────────────────────────
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      customer_email: user.email ?? undefined,
      success_url: `${baseUrl}/dashboard?upgrade=success`,
      cancel_url:  `${baseUrl}/dashboard`,
      metadata: { user_id: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    console.error('[/api/stripe/checkout] Stripe error:', e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Erro ao criar sessão de pagamento: ${msg}` }, { status: 500 });
  }
}
