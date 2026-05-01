-- Invite codes for B2B student onboarding.
-- A director creates a code for a specific class; students use /join/<code>
-- to link their profile to that school + class.

CREATE TABLE IF NOT EXISTS public.invite_codes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     uuid        NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id      uuid        NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  code          text        NOT NULL UNIQUE,
  created_by    uuid        NOT NULL REFERENCES auth.users(id),
  expires_at    timestamptz NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  max_uses      int         NOT NULL DEFAULT 100,
  uses          int         NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Directors can create invite codes for their own school
CREATE POLICY "director_insert_invite_code"
  ON public.invite_codes FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND school_id = (
      SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'director'
    )
  );

-- Directors can read their own school's codes
CREATE POLICY "director_read_invite_codes"
  ON public.invite_codes FOR SELECT
  USING (
    school_id = (
      SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'director'
    )
  );

-- Any authenticated user can read codes (for /join/[code] validation)
CREATE POLICY "student_read_single_invite_code"
  ON public.invite_codes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to increment the uses counter
CREATE POLICY "student_increment_uses"
  ON public.invite_codes FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
