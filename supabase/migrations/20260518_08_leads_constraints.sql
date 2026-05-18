-- P2-13: bound the public lead-capture insert.
-- The anon INSERT policy is intentional (public lead form).
-- Constraints defend against oversized payloads and malformed email.
ALTER TABLE public.leads
  ADD CONSTRAINT leads_email_len   CHECK (char_length(email) <= 320),
  ADD CONSTRAINT leads_email_shape CHECK (position('@' in email) > 1),
  ADD CONSTRAINT leads_name_len    CHECK (char_length(name) <= 200),
  ADD CONSTRAINT leads_whatsapp_len CHECK (char_length(whatsapp) <= 30);
