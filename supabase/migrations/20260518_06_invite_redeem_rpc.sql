-- P0-6: Atomic invite redemption. Validates code, enforces expiry &
-- max_uses, binds the CALLER's profile to the school/class, and increments
-- uses — all in one statement, immune to the read-modify-write race.

CREATE OR REPLACE FUNCTION public.redeem_invite_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_invite public.invite_codes%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  -- Atomic claim: only succeeds if not expired AND uses < max_uses.
  UPDATE public.invite_codes
     SET uses = uses + 1
   WHERE code = upper(p_code)
     AND expires_at > now()
     AND uses < max_uses
  RETURNING * INTO v_invite;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_or_exhausted');
  END IF;

  -- Open the guarded-column gate for THIS transaction only.
  PERFORM set_config('app.invite_redeem', 'on', true);

  UPDATE public.profiles
     SET school_id = v_invite.school_id,
         class_id  = v_invite.class_id
   WHERE id = v_uid;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Only authenticated users can call this.
REVOKE ALL ON FUNCTION public.redeem_invite_code(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.redeem_invite_code(text) TO authenticated;

-- Remove the over-permissive client UPDATE policy on invite_codes.
DROP POLICY IF EXISTS "student_increment_uses" ON public.invite_codes;

-- Students no longer SELECT invite rows directly (redemption is via RPC).
DROP POLICY IF EXISTS "student_read_single_invite_code" ON public.invite_codes;
