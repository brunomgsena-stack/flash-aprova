/**
 * POST /api/webhooks/abacate
 *
 * Recebe eventos do AbacatePay e promove o comprador para AiPro+.
 *
 * Fluxo ao receber PAID / CONFIRMED:
 *  1. Valida o segredo no header `x-webhook-secret`
 *  2. Extrai o e-mail do comprador (campo `externalId` ou `customer.email`)
 *  3a. Se usuário JÁ existe no Supabase → atualiza plano em user_stats
 *  3b. Se NÃO existe → cria conta via invite (envia e-mail de acesso) + define plano
 */

import { NextRequest, NextResponse }   from 'next/server';
import { createClient }                from '@supabase/supabase-js';
import { timingSafeEqual }             from 'crypto';

export const runtime = 'nodejs';

const PAID_STATUSES = new Set(['PAID', 'CONFIRMED']);

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
  id?:         string;        // ID único da cobrança — chave de idempotência
  event?:      string;
  status?:     string;
  externalId?: string;        // email do lead (setado na criação da cobrança)
  customer?: {
    email?: string;
    name?:  string;
  };
  // estrutura nested (data.*)
  data?: {
    id?:         string;
    status?:     string;
    externalId?: string;
    customer?: {
      email?: string;
      name?:  string;
    };
  };
}

// ── Normaliza o payload independente da estrutura enviada ─────────────────────
function extractFields(p: AbacatePayload): { status: string; email: string; name: string } {
  const status     = (p.data?.status     ?? p.status     ?? '').toUpperCase();
  const externalId =  p.data?.externalId ?? p.externalId ?? '';
  const customer   =  p.data?.customer   ?? p.customer;

  // externalId transporta o e-mail setado em /api/checkout
  // se não estiver lá, tentamos customer.email
  const email = (externalId.includes('@') ? externalId : customer?.email ?? '').trim().toLowerCase();
  const name  = (customer?.name ?? email.split('@')[0]).trim();

  return { status, email, name };
}

// ── Encontra user_id pelo e-mail (percorre páginas da auth.admin.listUsers) ───
// Para MVP: aceitável. Otimize com uma RPC/função SQL quando ultrapassar 10k usuários.
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

// ── Upsert do plano em user_stats ─────────────────────────────────────────────
async function grantProPlan(
  adminClient: ReturnType<typeof makeAdminClient>,
  userId:      string,
): Promise<void> {
  const { error } = await adminClient.from('user_stats').upsert(
    {
      user_id:         userId,
      plan:            'proai_plus',
      plan_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw new Error(`Falha ao gravar plano: ${error.message}`);
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Valida segredo ─────────────────────────────────────────────────────────
  const secret         = req.headers.get('x-webhook-secret');
  const expectedSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.error('[webhook/abacate] ABACATEPAY_WEBHOOK_SECRET não configurado.');
    return NextResponse.json({ error: 'Configuração interna incompleta.' }, { status: 500 });
  }
  // Comparação timing-safe para evitar timing attacks
  const secretOk = !!secret && secret.length === expectedSecret.length &&
    timingSafeEqual(Buffer.from(secret), Buffer.from(expectedSecret));
  if (!secretOk) {
    console.warn('[webhook/abacate] Segredo inválido.');
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  // 2. Parse do payload ───────────────────────────────────────────────────────
  let payload: AbacatePayload;
  try {
    payload = await req.json() as AbacatePayload;
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  const { status, email, name } = extractFields(payload);

  // 3. Ignora eventos que não são pagamento confirmado ────────────────────────
  if (!PAID_STATUSES.has(status)) {
    console.log(`[webhook/abacate] Status "${status}" ignorado.`);
    return NextResponse.json({ received: true, action: 'ignored' });
  }

  if (!email) {
    console.warn('[webhook/abacate] E-mail ausente no payload.', payload);
    return NextResponse.json({ error: 'E-mail do comprador não encontrado.' }, { status: 400 });
  }

  // 4. Idempotência — garante que cada cobrança seja processada uma única vez ──
  let adminClient: ReturnType<typeof makeAdminClient>;
  try {
    adminClient = makeAdminClient();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[webhook/abacate]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const eventId = payload.data?.id ?? payload.id ?? '';
  if (eventId) {
    const { error: insertError } = await adminClient
      .from('webhook_events')
      .insert({ event_id: eventId, payload });

    if (insertError) {
      // Código 23505 = violação de unique constraint → evento já processado
      if (insertError.code === '23505') {
        console.log(`[webhook/abacate] Evento ${eventId} já processado anteriormente. Ignorando.`);
        return NextResponse.json({ received: true, action: 'already_processed' });
      }
      // Outro erro de DB: loga mas não bloqueia o pagamento
      console.error('[webhook/abacate] Erro ao registrar webhook_event:', insertError.message);
    }
  } else {
    console.warn('[webhook/abacate] Payload sem campo id — idempotência não garantida.', { email, status });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://flashaprova.app';

  try {
    // Verifica se o usuário já existe ─────────────────────────────────────────
    const existingId = await findUserIdByEmail(adminClient, email);

    if (existingId) {
      // ── Usuário já tem conta: atualiza plano ──────────────────────────────
      await grantProPlan(adminClient, existingId);
      console.log(`[webhook/abacate] ✅ Plano atualizado para usuário existente ${existingId} (${email})`);
      return NextResponse.json({ received: true, action: 'plan_updated', userId: existingId });
    }

    // ── Usuário novo: cria conta + envia e-mail de acesso ─────────────────
    // inviteUserByEmail cria o usuário e envia e-mail com link para definir senha
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        data:       { name, plan: 'proai_plus' },
        redirectTo: `${baseUrl}/dashboard`,
      },
    );

    if (inviteError) {
      // Caso raro: usuário foi criado entre o listUsers e o invite
      // Tenta encontrar e atualizar
      console.warn('[webhook/abacate] Invite falhou, tentando fallback:', inviteError.message);
      const fallbackId = await findUserIdByEmail(adminClient, email);
      if (fallbackId) {
        await grantProPlan(adminClient, fallbackId);
        return NextResponse.json({ received: true, action: 'plan_updated_fallback', userId: fallbackId });
      }
      throw inviteError;
    }

    const newUserId = inviteData.user.id;
    await grantProPlan(adminClient, newUserId);

    console.log(`[webhook/abacate] ✅ Conta criada + convite enviado para ${email} (${newUserId})`);
    return NextResponse.json({ received: true, action: 'user_created', userId: newUserId });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[webhook/abacate] Erro ao processar upgrade:', msg, { email });
    return NextResponse.json({ error: `Falha ao processar upgrade: ${msg}` }, { status: 500 });
  }
}
