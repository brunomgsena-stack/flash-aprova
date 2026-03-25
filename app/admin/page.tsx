import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminImporter from './AdminImporter';

/**
 * Server Component — executado no servidor antes de qualquer HTML ser enviado.
 * Verifica se o usuário autenticado tem role === 'admin' na tabela profiles.
 * Se não tiver, redireciona para o Dashboard com aviso de acesso negado.
 */
export default async function AdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    redirect('/dashboard?error=unauthorized');
  }

  return <AdminImporter />;
}
