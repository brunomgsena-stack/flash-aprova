import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client.
 * Bypasses RLS — use only in server-side code (lib/, app/api/, server components).
 * Never import in client components or expose to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
