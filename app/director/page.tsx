import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDirectorDashboardData } from '@/lib/director-data';
import DirectorDashboard from '@/components/DirectorDashboard';

export const metadata = {
  title: 'Painel do Diretor — FlashAprova',
};

export default async function DirectorPage() {
  // Auth: get logged-in user from session cookie
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch real data (null = not a director or school not configured)
  const data = await getDirectorDashboardData(user.id);

  if (!data) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 text-center"
        style={{ background: '#0c0c14' }}
      >
        <p className="text-white/60 text-lg font-semibold">Escola não configurada</p>
        <p className="text-white/30 text-sm max-w-xs">
          Sua conta de diretor ainda não está vinculada a uma escola.
          Entre em contato com o suporte FlashAprova.
        </p>
      </div>
    );
  }

  return <DirectorDashboard data={data} />;
}
