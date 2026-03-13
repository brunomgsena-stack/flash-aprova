import { createBrowserClient } from '@supabase/ssr';

// Cookie-based client — session readable by middleware and server components
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
