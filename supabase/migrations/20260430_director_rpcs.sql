-- Migration: director RPCs
-- Two SECURITY DEFINER functions for the director dashboard.
-- Uses service-role context (bypass RLS) when called from lib/director-data.ts.

-- ─── RPC 1: School-level aggregate stats ─────────────────────────────────────
-- Returns engagement_pct, memory_score, students_at_risk, radar, critical_subjects,
-- top_subject, critical_subject for a given school_id.
--
-- Retention formula: (ease_factor - 1.3) / 1.2 * 100 → normalized 0-100.
-- ease_factor min ≈ 1.3 (very hard card), typical max ≈ 2.5 (easy card).

CREATE OR REPLACE FUNCTION get_director_school_stats(p_school_id uuid, p_days int DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total    int;
  v_active   int;
  v_interval interval;
BEGIN
  v_interval := (p_days || ' days')::interval;

  -- Total students enrolled in this school
  SELECT COUNT(*)::int INTO v_total
  FROM profiles
  WHERE school_id = p_school_id;

  -- Students who reviewed at least one card in the period
  SELECT COUNT(DISTINCT up.user_id)::int INTO v_active
  FROM user_progress up
  JOIN profiles p ON p.id = up.user_id
  WHERE p.school_id = p_school_id
    AND up.updated_at >= NOW() - v_interval;

  RETURN jsonb_build_object(

    -- Engagement: % of enrolled students active in the period
    'engagement_pct', CASE WHEN v_total > 0
      THEN ROUND(v_active * 100.0 / v_total)::int
      ELSE 0
    END,

    -- Memory score: average normalized ease_factor across all school progress records
    'memory_score', (
      SELECT COALESCE(
        ROUND(AVG(LEAST(100, GREATEST(0, (up.ease_factor - 1.3) / 1.2 * 100))))::int,
        0
      )
      FROM user_progress up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.school_id = p_school_id
        AND up.updated_at >= NOW() - v_interval
    ),

    -- Students at risk: have progress records but no activity in the period
    'students_at_risk', (
      SELECT COUNT(DISTINCT p.id)::int
      FROM profiles p
      WHERE p.school_id = p_school_id
        AND EXISTS (
          SELECT 1 FROM user_progress up2 WHERE up2.user_id = p.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM user_progress up3
          WHERE up3.user_id = p.id
            AND up3.updated_at >= NOW() - v_interval
        )
    ),

    -- Radar: avg retention per ENEM area
    'radar', (
      SELECT COALESCE(jsonb_agg(area_row), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'area', CASE s.category
            WHEN 'CIÊNCIAS DA NATUREZA'          THEN 'Natureza'
            WHEN 'CIÊNCIAS HUMANAS'              THEN 'Humanas'
            WHEN 'LINGUAGENS E CÓDIGOS'          THEN 'Linguagens'
            WHEN 'MATEMÁTICA E SUAS TECNOLOGIAS' THEN 'Matemática'
            ELSE s.category
          END,
          'value', ROUND(AVG(LEAST(100, GREATEST(0, (up.ease_factor - 1.3) / 1.2 * 100))))::int
        ) AS area_row
        FROM user_progress up
        JOIN profiles p  ON p.id   = up.user_id
        JOIN cards c     ON c.id   = up.card_id
        JOIN decks d     ON d.id   = c.deck_id
        JOIN subjects s  ON s.id   = d.subject_id
        WHERE p.school_id = p_school_id
          AND up.updated_at >= NOW() - v_interval
        GROUP BY s.category
      ) sub
    ),

    -- Critical subjects: top 5 decks with lowest average retention
    'critical_subjects', (
      SELECT COALESCE(jsonb_agg(cs_row ORDER BY cs_row->>'retention'), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'name',      d.title,
          'retention', ROUND(AVG(LEAST(100, GREATEST(0, (up.ease_factor - 1.3) / 1.2 * 100))))::int
        ) AS cs_row
        FROM user_progress up
        JOIN profiles p ON p.id = up.user_id
        JOIN cards c    ON c.id = up.card_id
        JOIN decks d    ON d.id = c.deck_id
        WHERE p.school_id = p_school_id
          AND up.updated_at >= NOW() - v_interval
        GROUP BY d.id, d.title
        ORDER BY AVG(up.ease_factor) ASC
        LIMIT 5
      ) sub
    ),

    -- Top subject: deck with highest avg retention
    'top_subject', (
      SELECT d.title
      FROM user_progress up
      JOIN profiles p ON p.id = up.user_id
      JOIN cards c    ON c.id = up.card_id
      JOIN decks d    ON d.id = c.deck_id
      WHERE p.school_id = p_school_id
        AND up.updated_at >= NOW() - v_interval
      GROUP BY d.id, d.title
      ORDER BY AVG(up.ease_factor) DESC
      LIMIT 1
    ),

    -- Critical subject: deck with lowest avg retention
    'critical_subject', (
      SELECT d.title
      FROM user_progress up
      JOIN profiles p ON p.id = up.user_id
      JOIN cards c    ON c.id = up.card_id
      JOIN decks d    ON d.id = c.deck_id
      WHERE p.school_id = p_school_id
        AND up.updated_at >= NOW() - v_interval
      GROUP BY d.id, d.title
      ORDER BY AVG(up.ease_factor) ASC
      LIMIT 1
    )
  );
END;
$$;

-- ─── RPC 2: Class-level radar ──────────────────────────────────────────────────
-- Returns radar data (ENEM areas) for a single class.

CREATE OR REPLACE FUNCTION get_class_radar(p_class_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(area_row), '[]'::jsonb)
    FROM (
      SELECT jsonb_build_object(
        'area', CASE s.category
          WHEN 'CIÊNCIAS DA NATUREZA'          THEN 'Natureza'
          WHEN 'CIÊNCIAS HUMANAS'              THEN 'Humanas'
          WHEN 'LINGUAGENS E CÓDIGOS'          THEN 'Linguagens'
          WHEN 'MATEMÁTICA E SUAS TECNOLOGIAS' THEN 'Matemática'
          ELSE s.category
        END,
        'value', ROUND(AVG(LEAST(100, GREATEST(0, (up.ease_factor - 1.3) / 1.2 * 100))))::int
      ) AS area_row
      FROM user_progress up
      JOIN profiles p  ON p.id  = up.user_id
      JOIN cards c     ON c.id  = up.card_id
      JOIN decks d     ON d.id  = c.deck_id
      JOIN subjects s  ON s.id  = d.subject_id
      WHERE p.class_id = p_class_id
      GROUP BY s.category
    ) sub
  );
END;
$$;
