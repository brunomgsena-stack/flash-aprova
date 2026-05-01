-- Returns one row per school-director pair where at_risk_count > 0.
-- Used by the director-alerts Edge Function.

CREATE OR REPLACE FUNCTION get_all_schools_at_risk()
RETURNS TABLE(school_name text, director_email text, at_risk_count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.name                                              AS school_name,
    au.email                                            AS director_email,
    COUNT(DISTINCT risk_students.id)::int               AS at_risk_count
  FROM schools s
  JOIN profiles director_p ON director_p.school_id = s.id AND director_p.role = 'director'
  JOIN auth.users au ON au.id = director_p.id
  LEFT JOIN LATERAL (
    SELECT p.id
    FROM profiles p
    WHERE p.school_id = s.id
      AND EXISTS (SELECT 1 FROM user_progress up WHERE up.user_id = p.id)
      AND NOT EXISTS (
        SELECT 1 FROM user_progress up2
        WHERE up2.user_id = p.id AND up2.updated_at >= NOW() - INTERVAL '7 days'
      )
  ) risk_students ON TRUE
  GROUP BY s.id, s.name, au.email
  HAVING COUNT(DISTINCT risk_students.id) > 0;
END;
$$;
