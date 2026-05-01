/**
 * POST /api/webhooks/asaas
 *
 * Recebe eventos do Asaas e ativa o plano correto para o comprador.
 *
 * Fluxo ao receber PAYMENT_RECEIVED / PAYMENT_CONFIRMED:
 *  1. Valida o token no header `asaas-access-token` (timing-safe)
 *  2. Extrai dados do pagamento (paymentLink, customer, externalReference)
 *  3. Resolve qual plano corresponde ao paymentLink ou descrição
 *  4. Obtém o e-mail do cliente (externalReference → Asaas API)
 *  5. Se usuário JÁ existe → atualiza plano em user_stats + profiles
 *  6. Se NÃO existe → cria conta via invite + define plano
 *
 * Variáveis de ambiente necessárias:
 *   ASAAS_WEBHOOK_TOKEN   — token configurado no painel do Asaas
 *   ASAAS_API_KEY         — chave de acesso à API Asaas (production ou sandbox)
 *   ASAAS_API_URL         — (opcional) base URL da API; padrão: https://api.asaas.com/v3
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';
import { timingSafeEqual, randomBytes } from 'crypto';
import { sendAccessGrantedEmail }    from '@/lib/mail';

export const runtime = 'nodejs';

const PAID_EVENTS = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED']);

// ── Tipos de plano ────────────────────────────────────────────────────────────

type PlanSlug = 'aceleracao' | 'panteao_elite';

interface PlanInfo {
  slug: PlanSlug;
  name: string;
}

const PLANS: Record<PlanSlug, PlanInfo> = {
  aceleracao:    { slug: 'aceleracao',    name: 'Protocolo Básico' },
  panteao_elite: { slug: 'panteao_elite', name: 'Protocolo Neural' },
};

// Mapeamento dos IDs dos payment links do Asaas → plano
const PAYMENT_LINK_PLANS: Record<string, PlanSlug> = {
  '5eavmb23sffhvvni': 'aceleracao',
  'cahneqkzx0cn05yh': 'panteao_elite',
};

// ── Admin client — ignora RLS ─────────────────────────────────────────────────

function makeAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars não configuradas.');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Busca e-mail + nome do cliente na API do Asaas ───────────────────────────

async function fetchAsaasCustomer(customerId: string): Promise<{ email: string; name: string } | null> {
  const apiKey  = process.env.ASAAS_API_KEY;
  const baseUrl = process.env.ASAAS_API_URL ?? 'https://api.asaas.com/v3';

  if (!apiKey) {
    console.error('[webhook/asaas] ASAAS_API_KEY não configurada — não foi possível buscar cliente.');
    return null;
  }

  try {
    const res = await fetch(`${baseUrl}/customers/${customerId}`, {
      headers: { access_token: apiKey },
    });

    if (!res.ok) {
      console.error(`[webhook/asaas] Asaas API retornou HTTP ${res.status} para customer ${customerId}`);
      return null;
    }

    const data = (await res.json()) as { email?: string; name?: string };
    const email = data.email?.trim().toLowerCase() ?? '';
    const name  = data.name?.trim() ?? email.split('@')[0];

    if (!email) {
      console.error(`[webhook/asaas] E-mail vazio na resposta da Asaas API. customerId=${customerId}`);
      return null;
    }

    return { email, name };
  } catch (err) {
    console.error('[webhook/asaas] Erro ao chamar Asaas API:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

// ── Resolve o plano pelo paymentLink ou descrição ─────────────────────────────

function resolvePlan(
  paymentLinkId: string | null | undefined,
  description:   string | null | undefined,
): PlanInfo | null {
  // 1. Pelo ID do payment link (mais confiável)
  if (paymentLinkId) {
    const slug = PAYMENT_LINK_PLANS[paymentLinkId];
    if (slug) return PLANS[slug];
  }

  // 2. Pela descrição do pagamento como fallback
  if (description) {
    const d = description.toLowerCase();
    if (d.includes('panteao') || d.includes('panteão') || d.includes('elite') || d.includes('neural')) return PLANS.panteao_elite;
    if (d.includes('aceleracao') || d.includes('aceleração') || d.includes('basico') || d.includes('básico')) return PLANS.aceleracao;
  }

  return null;
}

// ── Localiza user_id pelo e-mail ──────────────────────────────────────────────

async function findUserIdByEmail(
  adminClient: ReturnType<typeof makeAdminClient>,
  email: string,
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

// ── Grava o plano em user_stats + profiles ────────────────────────────────────

async function grantPlan(
  adminClient: ReturnType<typeof makeAdminClient>,
  userId: string,
  plan:   PlanInfo,
): Promise<void> {
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const { error: statsError } = await adminClient
    .from('user_stats')
    .upsert({ user_id: userId, plan: plan.slug, plan_expires_at: expiresAt }, { onConflict: 'user_id' });

  if (statsError) {
    console.error(`[webhook/asaas] Falha ao gravar user_stats. userId=${userId}`, statsError);
    throw new Error(`Falha ao gravar user_stats: ${statsError.message}`);
  }

  // O trigger do Supabase pode criar o perfil automaticamente ao criar o utilizador.
  // Upsert (onConflict: 'id') garante que apenas actualiza se já existir, sem erro 23505.
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({ id: userId, plan: plan.slug, plan_name: plan.name }, { onConflict: 'id' });

  if (profileError) {
    console.error(`[webhook/asaas] Falha ao gravar profiles. userId=${userId}`, profileError);
    throw new Error(`Falha ao gravar profiles: ${profileError.message}`);
  }

  console.log(`[webhook/asaas] Plano "${plan.slug}" gravado com sucesso. userId=${userId} expires=${expiresAt}`);
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {

  // 1. Valida token ─────────────────────────────────────────────────────────────
  const token         = req.headers.get('asaas-access-token');
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

  if (!expectedToken) {
    console.error('[webhook/asaas] ASAAS_WEBHOOK_TOKEN não configurado.');
    return NextResponse.json({ error: 'Configuração interna incompleta.' }, { status: 500 });
  }

  const tokenOk =
    !!token &&
    token.length === expectedToken.length &&
    timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));

  if (!tokenOk) {
    console.error(
      '[webhook/asaas] Token inválido.',
      token ? `Recebido: ${token.slice(0, 4)}… (${token.length} chars)` : 'Header ausente.',
    );
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('[webhook/asaas] ALERTA: RESEND_API_KEY não está definida nas variáveis de ambiente!');
  }

  // 2. Parse do payload ──────────────────────────────────────────────────────────
  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    console.error('[webhook/asaas] Corpo da requisição não é JSON válido.');
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  const event = ((payload.event as string | undefined) ?? '').toUpperCase();
  console.log(`[webhook/asaas] Evento recebido: ${event}`, JSON.stringify(payload));

  // 3. Ignora eventos que não são pagamento confirmado ───────────────────────────
  if (!PAID_EVENTS.has(event)) {
    console.log(`[webhook/asaas] Evento "${event}" ignorado (não é pagamento confirmado).`);
    return NextResponse.json({ received: true, action: 'ignored', event });
  }

  // 4. Extrai dados do pagamento ─────────────────────────────────────────────────
  const payment       = (payload.payment as Record<string, unknown> | undefined) ?? {};
  const paymentId     = (payment.id            as string | undefined) ?? null;
  const customerId    = (payment.customer      as string | undefined) ?? null;
  const paymentLinkId = (payment.paymentLink   as string | undefined) ?? null;
  const description   = (payment.description   as string | undefined) ?? null;
  const customerEmail = (payment.customerEmail as string | undefined) ?? null;

  console.log(
    `[webhook/asaas] Dados extraídos: paymentId=${paymentId} customerId=${customerId}` +
    ` paymentLink=${paymentLinkId} customerEmail=${customerEmail}`,
  );

  // 5. Resolve o plano ───────────────────────────────────────────────────────────
  const plan = resolvePlan(paymentLinkId, description);
  if (!plan) {
    console.error(
      `[webhook/asaas] Plano não identificado. paymentLink="${paymentLinkId}" description="${description}"` +
      ` — adicione o ID ao mapa PAYMENT_LINK_PLANS ou verifique a descrição do pagamento.`,
    );
    return NextResponse.json({ received: true, action: 'unknown_plan' });
  }

  // 6. Obtém e-mail do cliente ───────────────────────────────────────────────────
  let email = '';
  let name  = '';

  // Prioridade 0: externalReference — enviado por nós ao criar a cobrança (mais confiável)
  const externalRef = (payment.externalReference as string | undefined) ?? null;
  if (externalRef?.includes('@')) {
    email = externalRef.trim().toLowerCase();
    name  = email.split('@')[0];
    console.log(`[webhook/asaas] E-mail obtido via payment.externalReference: ${email}`);
  }

  // Prioridade 1: campo customerEmail direto no payload
  if (!email && customerEmail?.includes('@')) {
    email = customerEmail.trim().toLowerCase();
    name  = email.split('@')[0];
    console.log(`[webhook/asaas] E-mail obtido via payment.customerEmail: ${email}`);
  }

  // Prioridade 2: busca o objeto customer na API Asaas pelo customerId
  if (!email && customerId) {
    console.log(`[webhook/asaas] Buscando cliente na Asaas API. customerId=${customerId}`);
    const customer = await fetchAsaasCustomer(customerId);
    if (customer) {
      email = customer.email;
      name  = customer.name;
      console.log(`[webhook/asaas] E-mail obtido via Asaas API: ${email}`);
    }
  }

  if (!email) {
    console.error('[ WEBHOOK: ERRO CRÍTICO - PAGAMENTO SEM IDENTIFICAÇÃO DE E-MAIL ]');
    return NextResponse.json({ error: 'E-mail do comprador não encontrado.' }, { status: 400 });
  }

  console.log(`[webhook/asaas] Processando plano="${plan.slug}" para email="${email}"`);

  // 7. Admin client ──────────────────────────────────────────────────────────────
  let adminClient: ReturnType<typeof makeAdminClient>;
  try {
    adminClient = makeAdminClient();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[webhook/asaas]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // 8. Idempotência ──────────────────────────────────────────────────────────────
  // Usa upsert para não bloquear reprocessamento manual (testes e reenvios de acesso).
  if (paymentId) {
    const eventKey = `asaas_${paymentId}`;
    const { error: upsertError } = await adminClient
      .from('webhook_events')
      .upsert({ event_id: eventKey, payload }, { onConflict: 'event_id' });

    if (upsertError) {
      // Não-fatal: loga mas continua o processamento
      console.error('[webhook/asaas] Erro ao registrar webhook_event (não-fatal):', upsertError.message);
    } else {
      console.log(`[webhook/asaas] webhook_event registado/actualizado: ${eventKey}`);
    }
  }

  // 9. Atualiza ou cria o usuário ────────────────────────────────────────────────
  const baseUrl  = process.env.NEXT_PUBLIC_URL ?? 'https://flashaprova.app';
  const loginUrl = `${baseUrl}/login`;

  try {
    const existingId = await findUserIdByEmail(adminClient, email);

    if (existingId) {
      // Usuário existente: atualiza plano e notifica
      await grantPlan(adminClient, existingId, plan);
      console.log(`[ WEBHOOK: PLANO ATUALIZADO: ${email} ]`);

      try {
        const res = await sendAccessGrantedEmail({ to: email, name, planName: plan.name, loginUrl });
        console.log('[ EMAIL ENVIADO ] ID do Resend:', res.data?.id || 'SEM ID');
      } catch (err) {
        console.error('[ EMAIL ERRO ] Falha ao enviar email (usuário existente):', err instanceof Error ? err.message : String(err));
      }

      return NextResponse.json({ received: true, action: 'plan_updated', plan: plan.slug, userId: existingId });
    }

    // Usuário novo: cria conta com senha temporária
    const tempPassword = generatePassword();
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password:      tempPassword,
      email_confirm: true,
      user_metadata: { name, plan: plan.slug },
    });

    if (createError) {
      // Race condition: usuário criado entre o find e o createUser
      console.error(`[webhook/asaas] createUser falhou: ${createError.message} status=${createError.status}`, createError);
      console.error('[webhook/asaas] Tentando fallback por e-mail…');
      const fallbackId = await findUserIdByEmail(adminClient, email);
      if (fallbackId) {
        await grantPlan(adminClient, fallbackId, plan);
        console.log(`[ WEBHOOK: NOVO OPERADOR CRIADO E SINCRONIZADO: ${email} ]`);

        try {
          const res = await sendAccessGrantedEmail({ to: email, name, planName: plan.name, loginUrl, tempPassword });
          console.log('[ EMAIL ENVIADO ] ID do Resend:', res.data?.id || 'SEM ID');
        } catch (err) {
          console.error('[ EMAIL ERRO ] Falha ao enviar email (fallback):', err instanceof Error ? err.message : String(err));
        }

        return NextResponse.json({ received: true, action: 'plan_updated_fallback', plan: plan.slug, userId: fallbackId });
      }
      throw createError;
    }

    const newUserId = createData.user.id;
    await grantPlan(adminClient, newUserId, plan);
    console.log(`[ WEBHOOK: NOVO OPERADOR CRIADO E SINCRONIZADO: ${email} ]`);

    try {
      const res = await sendAccessGrantedEmail({ to: email, name, planName: plan.name, loginUrl, tempPassword });
      console.log('[ EMAIL ENVIADO ] ID do Resend:', res.data?.id || 'SEM ID');
    } catch (err) {
      console.error('[ EMAIL ERRO ] Falha ao enviar email (novo usuário):', err instanceof Error ? err.message : String(err));
    }

    return NextResponse.json({ received: true, action: 'user_created', plan: plan.slug, userId: newUserId });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[ WEBHOOK: FALHA CRÍTICA NA OPERAÇÃO: ${msg} ]`);
    return NextResponse.json({ error: 'Erro interno ao processar.' }, { status: 500 });
  }
}

// ── Gerador de senha segura ───────────────────────────────────────────────────

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
  return Array.from(randomBytes(12))
    .map(b => chars[b % chars.length])
    .join('');
}

