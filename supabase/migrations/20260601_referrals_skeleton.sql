-- ═══════════════════════════════════════════════════════════════════════════
-- 🚨 TODO PARA O DONO: Sistema de Referral (B.5 do PLANO_LANDING_REVAMP)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Este arquivo é ESQUELETO. Não está aplicado ainda. Para ativar:
--
-- 1) Revisar o schema abaixo (campos, RLS, índices)
-- 2) Decidir a regra de recompensa (ver bloco "TODO RECOMPENSA")
-- 3) Aplicar:
--    • Via Supabase Dashboard: copie o conteúdo e rode no SQL editor
--    • Via CLI: supabase db push (após confirmar que o nome de arquivo
--      bate com a sequência das migrations existentes)
-- 4) Implementar a API: ver app/api/referrals/route.ts
-- 5) Conectar o UI: ver components/ReferralProgram.tsx
-- 6) Notificar o referrer (email/in-app) quando referred converter — fora deste SQL
--
-- ⚠️ ANTES DE APLICAR: confirme que as tabelas `users` e `subscriptions`
-- (ou equivalentes) já existem no seu Supabase com os nomes assumidos abaixo.
-- Se forem diferentes, ajustar referências antes de rodar.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Tabela referrals ──────────────────────────────────────────────────
-- Um registro = uma indicação enviada por um usuário a um email.

CREATE TABLE IF NOT EXISTS public.referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Quem indicou (usuário pagante já dentro do sistema)
  referrer_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Código curto único pra usar em link compartilhado (ex: "abc12xyz")
  referral_code   TEXT NOT NULL UNIQUE,

  -- Quem foi indicado (preenchido só quando converter)
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Email do indicado (capturado no momento que ele clica e cadastra)
  referred_email  TEXT,

  -- Status do funil
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'signed_up', 'paid', 'rewarded', 'expired', 'fraud')),

  -- Quando cada milestone aconteceu
  clicked_at      TIMESTAMPTZ,
  signed_up_at    TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  rewarded_at     TIMESTAMPTZ,

  -- Recompensa atribuída (ex: 30 dias grátis pra ambos)
  -- TODO RECOMPENSA: decidir entre:
  --   (a) dias_extras: INT — quantos dias somar à assinatura ativa
  --   (b) cashback_centavos: INT — desconto em centavos
  --   (c) credito_cards: INT — créditos pra acessar cards premium
  reward_type     TEXT,   -- 'days' | 'cashback' | 'credit'
  reward_amount   INT,    -- quantidade conforme reward_type

  -- Anti-fraude (mesmo IP, mesmo dispositivo, fingerprint)
  ip_address      INET,
  user_agent      TEXT,
  fingerprint     TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx     ON public.referrals (referrer_id);
CREATE INDEX IF NOT EXISTS referrals_referral_code_idx   ON public.referrals (referral_code);
CREATE INDEX IF NOT EXISTS referrals_status_idx          ON public.referrals (status);
CREATE INDEX IF NOT EXISTS referrals_referred_email_idx  ON public.referrals (referred_email)
  WHERE referred_email IS NOT NULL;

-- Trigger pra atualizar updated_at
CREATE OR REPLACE FUNCTION public.referrals_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS referrals_updated_at_trigger ON public.referrals;
CREATE TRIGGER referrals_updated_at_trigger
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.referrals_set_updated_at();

-- ─── 2. RLS ───────────────────────────────────────────────────────────────
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Usuário vê suas próprias indicações
CREATE POLICY referrals_select_own ON public.referrals
  FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid());

-- Usuário cria sua própria indicação
CREATE POLICY referrals_insert_own ON public.referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (referrer_id = auth.uid());

-- TODO: ajustar policy de UPDATE pra permitir só service_role atualizar
-- status (clicked → signed_up → paid → rewarded) via webhook do gateway.
-- Por enquanto deixo permissivo pra dev — REVISAR ANTES DE PROD.
CREATE POLICY referrals_update_service ON public.referrals
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── 3. Helper RPC: gerar código único do usuário ─────────────────────────
-- Cada usuário tem 1 código fixo (não gera novo a cada indicação).
-- Se o usuário não tem código ainda, cria. Se já tem, retorna.

CREATE OR REPLACE FUNCTION public.get_or_create_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_code TEXT;
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Já existe?
  SELECT referral_code INTO v_code
  FROM public.referrals
  WHERE referrer_id = v_user
  LIMIT 1;

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  -- Gera novo código de 8 chars (a-z + 0-9, evita 0/o/1/l/i pra clareza)
  LOOP
    v_code := lower(substring(
      regexp_replace(encode(gen_random_bytes(8), 'base64'), '[^a-z0-9]', '', 'g'),
      1, 8
    ));
    EXIT WHEN length(v_code) = 8 AND NOT EXISTS (
      SELECT 1 FROM public.referrals WHERE referral_code = v_code
    );
  END LOOP;

  -- Cria registro "seed" só pra reservar o código (status pending até alguém clicar)
  INSERT INTO public.referrals (referrer_id, referral_code, status)
  VALUES (v_user, v_code, 'pending');

  RETURN v_code;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_or_create_referral_code() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_or_create_referral_code() TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- TODOs PENDENTES (fora desta migration):
-- ═══════════════════════════════════════════════════════════════════════════
-- [ ] Função/Webhook: quando uma assinatura nova for paga, checar se vem com
--     referral_code (via metadata do Stripe/Hotmart/Eduzz) e atualizar a
--     referral correspondente pra status='paid' + atribuir reward.
-- [ ] Função: aplicar reward (somar 30 dias na assinatura do referrer + 30
--     do referred). Implementar como RPC `apply_referral_reward(referral_id)`.
-- [ ] Email: notificar referrer quando referred converter (Resend/Postmark).
-- [ ] Detecção de fraude básica: bloquear se mesmo IP/fingerprint criar mais
--     de N referrals em 24h, ou se referrer e referred têm mesmo email.
-- ═══════════════════════════════════════════════════════════════════════════
