// ─── Server-side auth helpers ─────────────────────────────────────────────────
// Centraliza as verificações de autenticação e autorização para Server Components
// e Route Handlers, evitando repetição do padrão supabase.auth.getUser() + redirect.

import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

/**
 * Garante que existe um usuário autenticado.
 * Redireciona para /login se não houver sessão.
 * Retorna o userId como string.
 */
export async function requireAuth(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return user.id;
}

/**
 * Garante que existe um usuário autenticado com role === 'admin'.
 * Redireciona para /login ou /dashboard?error=unauthorized conforme o caso.
 * Retorna o userId como string.
 */
export async function requireAdmin(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') redirect('/dashboard?error=unauthorized');
  return user.id;
}
