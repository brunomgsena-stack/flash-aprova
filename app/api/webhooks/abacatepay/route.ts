/**
 * POST /api/webhooks/abacate
 *
 * Recebe eventos do AbacatePay e ativa o plano correto para o comprador.
 *
 * Fluxo ao receber PAID / CONFIRMED:
 *  1. Valida o segredo no header `x-webhook-secret` (timing-safe)
 *  2. Extrai e-mail + productId do payload
 *  3. Resolve qual plano corresponde ao productId
 *  4. Se usuário JÁ existe → atualiza plano em user_stats + profiles
 *  5. Se NÃO existe → cria conta via invite + define plano
 *
 * Variáveis de ambiente necessárias:
 *   ABACATEPAY_WEBHOOK_SECRET
 *   ABACATEPAY_PRODUCT_ID_FLASH   (prod_xPA4LaXyuDA2J4TudB1qt4x2)
 *   ABACATEPAY_PRODUCT_ID_AIPRO   (prod_pssxUzLuy2CMgwp0SDzxhh5A)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';
import { timingSafeEqual }           from 'crypto';
import { sendWelcomeEmail }          from '@/lib/mail';

export const runtime = 'nodejs';

const PAID_STATUSES = new Set(['PAID', 'CONFIRMED']);

// ── Tipos de plano suportados ─────────────────────────────────────────────────

type PlanSlug = 'aceleracao' | 'panteao_elite';

interface PlanInfo {
  slug:     PlanSlug;
  name:     string;   // valor aceito pelo CHECK constraint em profiles.plan_name
  metaKey:  string;   // valor passado no user_metadata no invite
}

const PLANS: Record<PlanSlug, PlanInfo> = {
  aceleracao:    { slug: 'aceleracao',    name: 'Aceleração',    metaKey: 'aceleracao'    },
  panteao_elite: { slug: 'panteao_elite', name: 'Panteão Elite', metaKey: 'panteao_elite' },
};

// ── Resolve plano a partir do metadata.plan_slug ou productId ─────────────────

function resolvePlan(
  productId: string | null | undefined,
  planSlug:  string | null | undefined,
): PlanInfo | null {
  // Preferência: plan_slug enviado no metadata pelo checkout
  if (planSlug && PLANS[planSlug as PlanSlug]) {
    return PLANS[planSlug as PlanSlug];
  }

  const flashId = process.env.ABACATEPAY_PRODUCT_ID_FLASH;
  const aiproId = process.env.ABACATEPAY_PRODUCT_ID_AIPRO;

  if (flashId && productId === flashId) return PLANS.aceleracao;
  if (aiproId && productId === aiproId) return PLANS.panteao_elite;

  // Fallback: se os IDs de produto não estiverem configurados
  if (!flashId && !aiproId) {
    return PLANS.panteao_elite;
  }

  return null;
}

// ── Admin client — ignora RLS ─────────────────────────────────────────────────

function makeAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars não configuradas.');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Payload do AbacatePay (flat ou nested) ────────────────────────────────────

interface AbacatePayload {
  id?:         string;
  event?:      string;
  status?:     string;
  externalId?: string;
  productId?:  string;
  metadata?: {
    plan_slug?:  string;
    expires_at?: string;
  };
  customer?: {
    email?: string;
    name?:  string;
  };
  data?: {
    id?:         string;
    status?:     string;
    externalId?: string;
    productId?:  string;
    metadata?: {
      plan_slug?:  string;
      expires_at?: string;
    };
    customer?: {
      email?: string;
      name?:  string;
    };
  };
}

// ── Normaliza campos independente da estrutura ────────────────────────────────

function extractFields(p: AbacatePayload): {
  status:     string;
  email:      string;
  name:       string;
  productId:  string | null;
  planSlug:   string | null;
  expiresAt:  string | null;
} {
  const status     = (p.data?.status     ?? p.status     ?? '').toUpperCase();
  const externalId =  p.data?.externalId ?? p.externalId ?? '';
  const customer   =  p.data?.customer   ?? p.customer;
  const productId  =  p.data?.productId  ?? p.productId  ?? null;
  const metadata   =  p.data?.metadata   ?? p.metadata;

  const email     = (externalId.includes('@') ? externalId : customer?.email ?? '').trim().toLowerCase();
  const name      = (customer?.name ?? email.split('@')[0]).trim();
  const planSlug  = metadata?.plan_slug  ?? null;
  const expiresAt = metadata?.expires_at ?? null;

  return { status, email, name, productId, planSlug, expiresAt };
}

// ── Localiza user_id pelo e-mail ──────────────────────────────────────────────

async function findUserIdByEmail(
  adminClient: ReturnType<typeof makeAdminClient>,
  email:       string,
): Promise<string | null> {
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data: { users }, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error || !users.length) break;
    const found = users.find(u => u.email?.toLowerCase() === email);
    if (found) return found.id;
    if (users.length < perPage) break;
    page++;
  }
  return null;
}

// ── Grava o plano em user_stats + profiles ───────────────────────────────────

async function grantPlan(
  adminClient:       ReturnType<typeof makeAdminClient>,
  userId:            string,
  plan:              PlanInfo,
  expiresAtOverride: string | null = null,
): Promise<void> {
  // Usa a data de expiração do metadata (enviada pelo checkout) ou fallback de +365 dias
  const expiresAt = expiresAtOverride ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const { error: statsError } = await adminClient.from('user_stats').upsert(
    { user_id: userId, plan: plan.slug, plan_expires_at: expiresAt },
    { onConflict: 'user_id' },
  );
  if (statsError) throw new Error(`Falha ao gravar user_stats: ${statsError.message}`);

  const { error: profileError } = await adminClient.from('profiles').upsert(
    { id: userId, plan: plan.slug, plan_name: plan.name },
    { onConflict: 'id' },
  );
  if (profileError) throw new Error(`Falha ao gravar profiles: ${profileError.message}`);
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {

  // 1. Valida segredo ──────────────────────────────────────────────────────────
  const secret         = req.headers.get('x-webhook-secret');
  const expectedSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.error('[webhook/abacate] ABACATEPAY_WEBHOOK_SECRET não configurado.');
    return NextResponse.json({ error: 'Configuração interna incompleta.' }, { status: 500 });
  }

  const secretOk = !!secret && secret.length === expectedSecret.length &&
    timingSafeEqual(Buffer.from(secret), Buffer.from(expectedSecret));
  if (!secretOk) {
    console.error('[webhook/abacate] Tentativa com segredo inválido.');
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  // 2. Parse do payload ────────────────────────────────────────────────────────
  let payload: AbacatePayload;
  try {
    payload = await req.json() as AbacatePayload;
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  const { status, email, name, productId, planSlug, expiresAt } = extractFields(payload);

  // 3. Ignora eventos que não são pagamento confirmado ─────────────────────────
  if (!PAID_STATUSES.has(status)) {
    return NextResponse.json({ received: true, action: 'ignored' });
  }

  // 4. Resolve o plano pelo metadata.plan_slug ou productId ────────────────────
  const plan = resolvePlan(productId, planSlug);
  if (!plan) {
    console.error(`[webhook/abacate] productId desconhecido: "${productId}".`);
    return NextResponse.json({ received: true, action: 'unknown_product' });
  }

  if (!email) {
    console.error('[webhook/abacate] E-mail ausente no payload.');
    return NextResponse.json({ error: 'E-mail do comprador não encontrado.' }, { status: 400 });
  }

  // 5. Admin client ────────────────────────────────────────────────────────────
  let adminClient: ReturnType<typeof makeAdminClient>;
  try {
    adminClient = makeAdminClient();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[webhook/abacate]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // 6. Idempotência ────────────────────────────────────────────────────────────
  const eventId = payload.data?.id ?? payload.id ?? '';
  if (eventId) {
    const { error: insertError } = await adminClient
      .from('webhook_events')
      .insert({ event_id: eventId, payload });

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ received: true, action: 'already_processed' });
      }
      console.error('[webhook/abacate] Erro ao registrar webhook_event:', insertError.message);
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://flashaprova.app';

  try {
    const existingId = await findUserIdByEmail(adminClient, email);

    if (existingId) {
      await grantPlan(adminClient, existingId, plan, expiresAt);
      sendWelcomeEmail(email, name).catch(err =>
        console.error('[webhook/abacate] Falha ao enviar welcome email:', err instanceof Error ? err.message : String(err)),
      );
      return NextResponse.json({ received: true, action: 'plan_updated', plan: plan.slug, userId: existingId });
    }

    // Usuário novo: cria conta + define plano
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        data:       { name, plan: plan.metaKey },
        redirectTo: `${baseUrl}/dashboard`,
      },
    );

    if (inviteError) {
      // Invite falhou — tenta buscar user criado em paralelo (race condition)
      const fallbackId = await findUserIdByEmail(adminClient, email);
      if (fallbackId) {
        await grantPlan(adminClient, fallbackId, plan, expiresAt);
        sendWelcomeEmail(email, name).catch(err =>
          console.error('[webhook/abacate] Falha ao enviar welcome email (fallback):', err instanceof Error ? err.message : String(err)),
        );
        return NextResponse.json({ received: true, action: 'plan_updated_fallback', plan: plan.slug, userId: fallbackId });
      }
      throw inviteError;
    }

    const newUserId = inviteData.user.id;
    await grantPlan(adminClient, newUserId, plan, expiresAt);
    sendWelcomeEmail(email, name).catch(err =>
      console.error('[webhook/abacate] Falha ao enviar welcome email (new user):', err instanceof Error ? err.message : String(err)),
    );

    return NextResponse.json({ received: true, action: 'user_created', plan: plan.slug, userId: newUserId });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[webhook/abacate] Erro ao processar plano:', msg);
    return NextResponse.json({ error: `Falha ao processar plano: ${msg}` }, { status: 500 });
  }
}
