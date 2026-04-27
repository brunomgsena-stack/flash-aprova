-- Add first_session_completed column to profiles
-- Tracks whether the user has completed the guided onboarding first session
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_session_completed BOOLEAN DEFAULT FALSE;
