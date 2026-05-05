// Re-export the app-wide singleton to avoid multiple Supabase auth clients
// competing for the same Web Lock (causes AbortError: "Lock broken by steal").
import { supabase } from '@/lib/supabaseClient';

export function createClient() {
  return supabase;
}
