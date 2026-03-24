/**
 * POST /api/webhooks/abacate
 *
 * Recebe eventos do AbacatePay e promove o usuário para AiPro+ quando o
 * pagamento é confirmado.
 *
 * Fluxo:
 *  1. Valida o segredo no header `x-webhook-secret`
 *  2. Lê o `externalId` do payload (deve ser o `user_id` do Supabase)
 *  3. Se status for PAID ou CONFIRMED, grava `plan = 'proai_plus'` em user_stats
 *
 * Segurança:
 *  - Usa SUPABASE_SERVICE_ROLE_KEY para ignorar as regras de RLS
 *    (operação de sistema, não de usuário)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';

export const runtime = 'nodejs';

// ── Statuses que confirmam pagamento ──────────────────────────────────────────
const PAID_STATUSES = new Set(['PAID', 'CONFIRMED']);

// ── Admin client — usa service role, ignora RLS ───────────────────────────────
function makeAdminClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados.');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Payload enviado pelo AbacatePay ───────────────────────────────────────────
interface AbacatePayload {
  event:      string;           // ex: 'billing.paid'
  externalId: string;           // user_id do Supabase (definido ao criar a cobrança)
  status:     string;           // PAID | CONFIRMED | PENDING | CANCELLED ...
  amount?:    number;
  billingId?: string;
}

export async function POST(req: NextRequest) {
  // ── 1. Validação do segredo ────────────────────────────────────────────────
  const secret         = req.headers.get('x-webhook-secret');
  const expectedSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.error('[webhook/abacate] ABACATEPAY_WEBHOOK_SECRET não configurado.');
    return NextResponse.json({ error: 'Configuração interna incompleta.' }, { status: 500 });
  }

  if (secret !== expectedSecret) {
    console.warn('[webhook/abacate] Segredo inválido — possível requisição não autorizada.');
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  // ── 2. Parse do payload ────────────────────────────────────────────────────
  let payload: AbacatePayload;
  try {
    payload = await req.json() as AbacatePayload;
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  const { externalId, status, billingId } = payload;

  if (!externalId) {
    console.warn('[webhook/abacate] Payload sem externalId.', payload);
    return NextResponse.json({ error: 'externalId ausente.' }, { status: 400 });
  }

  // ── 3. Ignora eventos que não são pagamento confirmado ─────────────────────
  if (!PAID_STATUSES.has(status?.toUpperCase())) {
    console.log(`[webhook/abacate] Status "${status}" ignorado para usuário ${externalId}.`);
    return NextResponse.json({ received: true, action: 'ignored' });
  }

  // ── 4. Upgrade do plano no Supabase ───────────────────────────────────────
  let supabase;
  try {
    supabase = makeAdminClient();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[webhook/abacate] Falha ao criar admin client:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Tenta fazer upsert: se não existir linha em user_stats, cria uma.
  const { error } = await supabase
    .from('user_stats')
    .upsert(
      {
        user_id:  externalId,
        plan:     'proai_plus',
        // Expira em 1 ano a partir de agora
        plan_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    console.error('[webhook/abacate] Erro ao atualizar plano:', error.message, { externalId, billingId });
    return NextResponse.json({ error: 'Falha ao atualizar plano.' }, { status: 500 });
  }

  console.log(`[webhook/abacate] ✅ Usuário ${externalId} promovido para proai_plus. billingId=${billingId ?? 'N/A'}`);
  return NextResponse.json({ received: true, action: 'upgraded', userId: externalId });
}
