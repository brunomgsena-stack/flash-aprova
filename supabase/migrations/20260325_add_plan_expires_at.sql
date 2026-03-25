-- Adiciona coluna de expiração de plano em user_stats.
-- Necessária para o webhook do AbacatePay registrar a validade da assinatura AiPro+.
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;
