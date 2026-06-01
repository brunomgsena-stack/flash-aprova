/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚨 TODO PARA O DONO: API Route do Sistema de Referral (B.5 do PLANO)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Esta é a rota base. Suporta 2 ações:
 *   GET  /api/referrals          → retorna { code, stats } do usuário logado
 *   POST /api/referrals          → registra um click externo (alguém entrou
 *                                  pela URL /?ref=CODE)
 *
 * Antes de usar:
 * 1) Rodar a migration: supabase/migrations/20260601_referrals_skeleton.sql
 * 2) Conferir que `getSupabaseServerClient()` (ou equivalente) está
 *    disponível no projeto. Se o nome do helper for diferente,
 *    ajustar o import abaixo.
 * 3) Adicionar variáveis de ambiente se faltar:
 *      NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 4) Conectar com o webhook de pagamento (Stripe/Hotmart) pra disparar
 *    `apply_referral_reward()` quando uma referral converter.
 *
 * ⚠️ Esta rota não foi testada. Está estruturada pra ser auto-explicativa
 * mas pode precisar de ajustes baseado em como o resto do app autentica.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';

// TODO: ajustar este import pro helper de Supabase server-side do seu projeto.
// Procure por algo como `createServerClient`, `getSupabaseServer`, etc.
// Exemplo comum:
// import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET — retorna o código de indicação do usuário logado + stats.
 *
 * Resposta:
 *   {
 *     code: "abc12xyz",
 *     stats: {
 *       total_clicks: 0,
 *       total_signups: 0,
 *       total_paid: 0,
 *       total_rewarded: 0,
 *     }
 *   }
 */
export async function GET() {
  // TODO: implementar autenticação. Esqueleto:
  //
  //   const supabase = await createServerClient();
  //   const { data: { user }, error: authErr } = await supabase.auth.getUser();
  //   if (authErr || !user) {
  //     return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  //   }
  //
  //   // Chama o RPC criado na migration
  //   const { data: code, error: codeErr } = await supabase
  //     .rpc('get_or_create_referral_code');
  //   if (codeErr) {
  //     return NextResponse.json({ error: codeErr.message }, { status: 500 });
  //   }
  //
  //   // Agrega stats (todos os registros do usuário, agrupados por status)
  //   const { data: stats } = await supabase
  //     .from('referrals')
  //     .select('status')
  //     .eq('referrer_id', user.id);
  //
  //   const counts = {
  //     total_clicks:   stats?.filter(r => r.status !== 'pending').length ?? 0,
  //     total_signups:  stats?.filter(r => ['signed_up','paid','rewarded'].includes(r.status)).length ?? 0,
  //     total_paid:     stats?.filter(r => ['paid','rewarded'].includes(r.status)).length ?? 0,
  //     total_rewarded: stats?.filter(r => r.status === 'rewarded').length ?? 0,
  //   };
  //
  //   return NextResponse.json({ code, stats: counts });

  return NextResponse.json(
    {
      error: 'not_implemented',
      message: 'Implementar autenticação e chamada ao RPC get_or_create_referral_code. Ver TODOs neste arquivo.',
    },
    { status: 501 },
  );
}

/**
 * POST — registra um click externo (visita por link de referral).
 *
 * Body esperado: { code: string }
 *
 * Resposta:
 *   { ok: true, referral_id: "<uuid>" } ou
 *   { error: "invalid_code" }
 *
 * Esse endpoint vai ser chamado pelo middleware/cliente quando alguém
 * abrir a landing com ?ref=CODE. Marca o "clicked_at" pra rastrear funil.
 */
export async function POST(_req: Request) {
  // TODO:
  // 1. Validar body JSON com schema (zod ou parse manual)
  // 2. Buscar referral_code na tabela (sem auth — é público)
  // 3. Se existir, atualizar `clicked_at` se ainda nulo
  // 4. Capturar IP + User-Agent (de headers do request) pra anti-fraude
  // 5. Retornar referral_id pra cliente guardar em cookie/localStorage
  //    e usar no checkout depois.
  //
  // Esqueleto:
  //
  //   const body = await req.json();
  //   const code = body?.code;
  //   if (typeof code !== 'string' || code.length !== 8) {
  //     return NextResponse.json({ error: 'invalid_code' }, { status: 400 });
  //   }
  //   const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? null;
  //   const ua = req.headers.get('user-agent') ?? null;
  //
  //   const supabase = await createServerClient();
  //   const { data, error } = await supabase
  //     .from('referrals')
  //     .update({ clicked_at: new Date().toISOString(), ip_address: ip, user_agent: ua })
  //     .eq('referral_code', code)
  //     .is('clicked_at', null)
  //     .select('id')
  //     .single();
  //
  //   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  //   return NextResponse.json({ ok: true, referral_id: data.id });

  return NextResponse.json(
    {
      error: 'not_implemented',
      message: 'Implementar registro de click. Ver TODOs neste arquivo.',
    },
    { status: 501 },
  );
}
