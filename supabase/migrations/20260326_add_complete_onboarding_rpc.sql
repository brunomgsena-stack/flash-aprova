-- Função RPC para marcar onboarding como concluído.
-- SECURITY DEFINER ignora RLS, garantindo a gravação mesmo quando o JWT
-- do Route Handler não propaga corretamente o contexto RLS via anon key.
-- auth.uid() garante que apenas o próprio usuário altera o SEU perfil.
CREATE OR REPLACE FUNCTION public.complete_onboarding()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profiles
  SET onboarding_completed = true
  WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.complete_onboarding() TO anon, authenticated;
