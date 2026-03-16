-- ============================================================
-- FlashAprova – Migration: category na tabela subjects
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Adiciona coluna category
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS category text;

-- 2. Ciências da Natureza
UPDATE public.subjects SET category = 'Ciências da Natureza'
  WHERE title ILIKE '%biolog%'
     OR title ILIKE '%física%' OR title ILIKE '%fisica%'
     OR title ILIKE '%química%' OR title ILIKE '%quimica%';

-- 3. Ciências Humanas
UPDATE public.subjects SET category = 'Ciências Humanas'
  WHERE title ILIKE '%histór%' OR title ILIKE '%histor%'
     OR title ILIKE '%geograf%'
     OR title ILIKE '%filosofia%'
     OR title ILIKE '%sociolog%';

-- 4. Linguagens e Códigos
UPDATE public.subjects SET category = 'Linguagens e Códigos'
  WHERE title ILIKE '%portugu%'
     OR title ILIKE '%literatura%'
     OR title ILIKE '%artes%' OR title ILIKE '%arte%';

-- 5. Matemática
UPDATE public.subjects SET category = 'Matemática'
  WHERE title ILIKE '%matem%';

-- Verificação
SELECT title, category FROM public.subjects ORDER BY category, title;
