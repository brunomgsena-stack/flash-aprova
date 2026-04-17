/**
 * POST /api/checkout
 *
 * Fluxo simplificado AbacatePay v1:
 *   1. Autentica o utilizador via Supabase session (cookies SSR)
 *   2. POST /v1/billing/create com customer inline → obtém payUrl
 *   3. Retorna { url } para redirecionar o browser
 *
 * Body: { planId: 'aceleracao' | 'panteao_elite'; cpf: string; name?: string; whatsapp?: string }
 * Resposta: { url: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// ── Configuração de planos ─────────────────────────────────────────────────────

const PLAN_CONFIG: Record<string, {
  priceCents:  number;
  name:        string;
  description: string;
}> = {
  aceleracao: {
    priceCents:  59700,
    name:        'FlashAprova Aceleração',
    description: 'Flashcards SRS ilimitados + Dashboard — Acesso até ENEM 2026',
  },
  panteao_elite: {
    priceCents:  69700,
    name:        'FlashAprova Panteão Elite',
    description: 'Arsenal completo IA: 10 Tutores, Prof. Norma, Storytelling — 2 anos',
  },
};

// ── AbacatePay helpers ─────────────────────────────────────────────────────────

const ABACATE_BASE = 'https://api.abacatepay.com/v1';

function abacateHeaders(): HeadersInit {
  return {
    'Authorization': `Bearer ${process.env.ABACATEPAY_SECRET_KEY}`,
    'Content-Type':  'application/json',
  };
}

interface AbacateBillingData { id: string; url: string; status: string; }
interface AbacateBillingResponse { error: string | null; data?: AbacateBillingData; }

// ── Dev fallback ───────────────────────────────────────────────────────────────

async function devFallbackUser(): Promise<User | null> {
  const fallbackEmail = process.env.DEV_FALLBACK_USER_EMAIL;
  const serviceKey    = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl   = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!fallbackEmail || !serviceKey || !supabaseUrl) return null;

  const admin = createAdminClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let page = 1;
  while (true) {
    const { data: { users }, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !users?.length) break;
    const found = users.find(u => u.email?.toLowerCase() === fallbackEmail.toLowerCase());
    if (found) {
      console.warn(`[checkout] ⚠️  DEV FALLBACK: usando user ${found.id} (${found.email})`);
      return found as User;
    }
    if (users.length < 1000) break;
    page++;
  }
  return null;
}

// ── Cria cobrança com customer inline ─────────────────────────────────────────

async function createBilling(opts: {
  customer: { name: string; email: string; cpf?: string; whatsapp?: string };
  userId:   string;
  planId:   string;
  plan:     typeof PLAN_CONFIG[string];
  baseUrl:  string;
}): Promise<string> {
  const { customer, userId, planId, plan, baseUrl } = opts;
  const hasCpf = customer.cpf && customer.cpf.length === 11 && customer.cpf !== '00000000000';

  const body = {
    frequency:     'ONE_TIME',
    methods:       ['PIX', 'CREDIT_CARD'],
    customer: {
      name:  customer.name,
      email: customer.email,
      ...(hasCpf && { taxId: { number: customer.cpf, type: 'CPF' } }),
      ...(customer.whatsapp && { cellphone: customer.whatsapp }),
    },
    externalId:    userId,
    amount:        plan.priceCents,
    returnUrl:     `${baseUrl}/dashboard`,
    completionUrl: `${baseUrl}/dashboard?payment=success`,
    products: [{
      externalId:  planId,
      name:        plan.name,
      description: plan.description,
      quantity:    1,
      price:       plan.priceCents,
    }],
  };

  console.log('[AbacatePay] Enviando billing/create →', JSON.stringify(body, null, 2));

  const res = await fetch(`${ABACATE_BASE}/billing/create`, {
    method:  'POST',
    headers: abacateHeaders(),
    body:    JSON.stringify(body),
  });

  const text = await res.text();
  let json: AbacateBillingResponse;
  try   { json = JSON.parse(text) as AbacateBillingResponse; }
  catch { throw new Error(`AbacatePay billing/create — resposta inesperada (HTTP ${res.status}): ${text}`); }

  if (!res.ok || json.error || !json.data?.url) {
    console.error('[AbacatePay Error] HTTP', res.status, '| Resposta completa:', JSON.stringify(json, null, 2));
    throw new Error(`Falha ao criar cobrança: ${json.error ?? `HTTP ${res.status}`}`);
  }

  console.log(`[AbacatePay] billing/create OK → ${json.data.url}`);
  return json.data.url;
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!process.env.ABACATEPAY_SECRET_KEY) {
    console.error('[checkout] ABACATEPAY_SECRET_KEY ausente.');
    return NextResponse.json({ error: 'Configuração de pagamento incompleta.' }, { status: 500 });
  }

  // Auth
  const cookieStore   = await cookies();
  console.log('[checkout] cookies:', cookieStore.getAll().map(c => c.name));

  const serverClient  = await createClient();
  const { data: { user: sessionUser }, error: authError } = await serverClient.auth.getUser();
  console.log('[checkout] auth.getUser →', { id: sessionUser?.id ?? null, authError: authError?.message ?? null });

  let user: User | null = sessionUser;
  if (!user && process.env.NODE_ENV === 'development') {
    user = await devFallbackUser();
  }

  // Body
  let planId: string, cpf: string, bodyName: string | undefined, bodyEmail: string | undefined, bodyWhatsapp: string | undefined;
  try {
    const b = await req.json() as { planId?: string; cpf?: string; name?: string; email?: string; whatsapp?: string };
    console.log('[checkout] Corpo recebido na API:', b);
    planId        = (b.planId   ?? 'panteao_elite').trim();
    cpf           = (b.cpf      ?? '').replace(/\D/g, '');
    bodyName      = b.name?.trim()                   || undefined;
    bodyEmail     = b.email?.trim().toLowerCase()    || undefined;
    bodyWhatsapp  = b.whatsapp?.replace(/\D/g, '')   || undefined;
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const plan = PLAN_CONFIG[planId];
  if (!plan) {
    return NextResponse.json({ error: 'Plano inválido.' }, { status: 422 });
  }

  const name  = bodyName  ?? (user?.user_metadata?.name as string | undefined) ?? bodyEmail?.split('@')[0] ?? 'Aluno';
  const email = bodyEmail ?? user?.email ?? '';

  if (!email) {
    console.error('[checkout] E-mail ausente. bodyEmail:', bodyEmail, '| user.email:', user?.email);
    return NextResponse.json({ error: 'E-mail não encontrado. Informe seu e-mail para continuar.' }, { status: 400 });
  }

  // userId para rastreamento: usa o id do Supabase se autenticado, senão usa o email como identificador.
  const userId = user?.id ?? `anon:${email}`;

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://flashaprova.app';

  console.log('[checkout] criando cobrança para', { userId, email, planId, authenticated: !!user });

  try {
    const url = await createBilling({
      customer: { name, email, cpf: cpf || undefined, whatsapp: bodyWhatsapp ?? undefined },
      userId,
      planId,
      plan,
      baseUrl,
    });
    return NextResponse.json({ url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[checkout] Erro AbacatePay:', msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
