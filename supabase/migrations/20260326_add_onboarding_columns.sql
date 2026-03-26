-- Adiciona colunas de onboarding e plano de estudos ao perfil do aluno.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS target_course        text,
  ADD COLUMN IF NOT EXISTS target_university    text,
  ADD COLUMN IF NOT EXISTS daily_card_goal      int  DEFAULT 50,
  ADD COLUMN IF NOT EXISTS difficulty_subjects  jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
