-- Setup script for Colégio Elite mock data
-- Run this in Supabase Dashboard → SQL Editor

-- School and classes already created, now add mock students
-- These use test UUIDs - in production these would have real auth.users entries

-- STEP 1: Replace <YOUR_USER_ID> below with your actual user ID
-- Get your ID from: console → supabase.auth.getUser().then(d => console.log(d.data.user.id))

-- Update your profile to be director of Colégio Elite
UPDATE public.profiles
SET school_id = 'cccccccc-0000-0000-0000-000000000001', role = 'director'
WHERE id = '<YOUR_USER_ID>';

-- STEP 2: Insert mock students (these are demo-only, no auth.users entries needed)
-- The system fetches data but displays even without auth records
DELETE FROM public.user_progress 
WHERE user_id IN (
  '11111111-1111-1111-1111-111111111001','11111111-1111-1111-1111-111111111002','11111111-1111-1111-1111-111111111003',
  '11111111-1111-1111-1111-111111111004','11111111-1111-1111-1111-111111111005','11111111-1111-1111-1111-111111111006',
  '11111111-2222-2222-2222-222222222001','11111111-2222-2222-2222-222222222002','11111111-2222-2222-2222-222222222003',
  '11111111-2222-2222-2222-222222222004','11111111-2222-2222-2222-222222222005'
);

DELETE FROM public.profiles 
WHERE id IN (
  '11111111-1111-1111-1111-111111111001','11111111-1111-1111-1111-111111111002','11111111-1111-1111-1111-111111111003',
  '11111111-1111-1111-1111-111111111004','11111111-1111-1111-1111-111111111005','11111111-1111-1111-1111-111111111006',
  '11111111-2222-2222-2222-222222222001','11111111-2222-2222-2222-222222222002','11111111-2222-2222-2222-222222222003',
  '11111111-2222-2222-2222-222222222004','11111111-2222-2222-2222-222222222005'
);

-- Insert student profiles (using temporary UUIDs for demo)
INSERT INTO public.profiles (id, full_name, class_id, school_id, role)
VALUES
  ('11111111-1111-1111-1111-111111111001', 'Ana Silva', 'dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'student'),
  ('11111111-1111-1111-1111-111111111002', 'Bruno Costa', 'dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'student'),
  ('11111111-1111-1111-1111-111111111003', 'Carla Oliveira', 'dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'student'),
  ('11111111-1111-1111-1111-111111111004', 'Diego Martins', 'dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'student'),
  ('11111111-1111-1111-1111-111111111005', 'Elisa Rocha', 'dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'student'),
  ('11111111-1111-1111-1111-111111111006', 'Felipe Santos', 'dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'student'),
  ('11111111-2222-2222-2222-222222222001', 'Gabriela Lima', 'dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000001', 'student'),
  ('11111111-2222-2222-2222-222222222002', 'Henrique Dias', 'dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000001', 'student'),
  ('11111111-2222-2222-2222-222222222003', 'Isabella Ferreira', 'dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000001', 'student'),
  ('11111111-2222-2222-2222-222222222004', 'João Pereira', 'dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000001', 'student'),
  ('11111111-2222-2222-2222-222222222005', 'Karina Gomes', 'dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000001', 'student');

-- Insert progress data
INSERT INTO public.user_progress (user_id, card_id, ease_factor, updated_at, history)
VALUES
  ('11111111-1111-1111-1111-111111111001', 'card-001', 2.3, NOW() - INTERVAL '1 day', '[{"reviewed_at":"2026-05-04T14:30:00Z","rating":4,"interval_days":5},{"reviewed_at":"2026-05-03T10:15:00Z","rating":4,"interval_days":3},{"reviewed_at":"2026-05-02T18:45:00Z","rating":3,"interval_days":1}]'::jsonb),
  ('11111111-1111-1111-1111-111111111002', 'card-002', 1.95, NOW() - INTERVAL '2 days', '[{"reviewed_at":"2026-05-03T16:20:00Z","rating":3,"interval_days":4},{"reviewed_at":"2026-05-01T11:30:00Z","rating":2,"interval_days":2}]'::jsonb),
  ('11111111-1111-1111-1111-111111111003', 'card-003', 2.45, NOW(), '[{"reviewed_at":"2026-05-05T09:00:00Z","rating":4,"interval_days":6},{"reviewed_at":"2026-05-04T15:45:00Z","rating":4,"interval_days":4},{"reviewed_at":"2026-05-02T12:00:00Z","rating":4,"interval_days":2}]'::jsonb),
  ('11111111-1111-1111-1111-111111111004', 'card-004', 1.4, NOW() - INTERVAL '8 days', '[{"reviewed_at":"2026-04-27T20:10:00Z","rating":1,"interval_days":3}]'::jsonb),
  ('11111111-1111-1111-1111-111111111005', 'card-005', 1.8, NOW() - INTERVAL '1 day', '[{"reviewed_at":"2026-05-04T13:25:00Z","rating":2,"interval_days":3},{"reviewed_at":"2026-05-02T09:50:00Z","rating":3,"interval_days":2}]'::jsonb),
  ('11111111-1111-1111-1111-111111111006', 'card-006', 2.15, NOW() - INTERVAL '2 days', '[{"reviewed_at":"2026-05-03T17:30:00Z","rating":4,"interval_days":5},{"reviewed_at":"2026-05-01T14:15:00Z","rating":3,"interval_days":3}]'::jsonb),
  ('11111111-2222-2222-2222-222222222001', 'card-007', 2.35, NOW(), '[{"reviewed_at":"2026-05-05T10:45:00Z","rating":4,"interval_days":5},{"reviewed_at":"2026-05-04T08:20:00Z","rating":4,"interval_days":3}]'::jsonb),
  ('11111111-2222-2222-2222-222222222002', 'card-008', 1.5, NOW() - INTERVAL '7 days', '[{"reviewed_at":"2026-04-28T15:00:00Z","rating":2,"interval_days":2}]'::jsonb),
  ('11111111-2222-2222-2222-222222222003', 'card-009', 2.2, NOW() - INTERVAL '1 day', '[{"reviewed_at":"2026-05-04T11:30:00Z","rating":4,"interval_days":4},{"reviewed_at":"2026-05-02T16:45:00Z","rating":3,"interval_days":2}]'::jsonb),
  ('11111111-2222-2222-2222-222222222004', 'card-010', 1.75, NOW() - INTERVAL '3 days', '[{"reviewed_at":"2026-05-02T12:15:00Z","rating":2,"interval_days":4}]'::jsonb),
  ('11111111-2222-2222-2222-222222222005', 'card-011', 2.1, NOW() - INTERVAL '2 days', '[{"reviewed_at":"2026-05-03T19:00:00Z","rating":3,"interval_days":3},{"reviewed_at":"2026-05-01T10:30:00Z","rating":4,"interval_days":2}]'::jsonb);
