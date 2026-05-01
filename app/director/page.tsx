import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDirectorDashboardData } from '@/lib/director-data';
import DirectorDashboard, { type DashboardPeriod } from '@/components/DirectorDashboard';

export const metadata = {
  title: 'Painel do Diretor — FlashAprova',
};

export default async function DirectorPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const rawPeriod = params.period;
  const period: DashboardPeriod =
    rawPeriod === '30d' ? '30d' : rawPeriod === '90d' ? '90d' : '7d';
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const data = await getDirectorDashboardData(user.id, days);

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

  return <DirectorDashboard data={data} period={period} />;
}
