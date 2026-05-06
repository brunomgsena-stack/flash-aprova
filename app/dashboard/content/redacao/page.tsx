import { createClient } from '@/lib/supabase/server';
import { type Plan } from '@/lib/plan';
import RedacaoClient from './RedacaoClient';

export default async function RedacaoPage() {
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();

  let plan: Plan = 'aceleracao';
  if (user) {
    const [statsResult, profileResult] = await Promise.all([
      serverClient
        .from('user_stats')
        .select('plan, plan_expires_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      serverClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    const isAdmin   = profileResult.data?.role === 'admin';
    const rawPlan   = (statsResult.data?.plan as Plan | undefined) ?? 'aceleracao';
    const expiresAt = statsResult.data?.plan_expires_at
      ? new Date(statsResult.data.plan_expires_at)
      : null;
    const expired   = expiresAt ? expiresAt < new Date() : false;

    plan = isAdmin || (rawPlan === 'panteao_elite' && !expired) ? 'panteao_elite' : 'aceleracao';
  }

  return <RedacaoClient plan={plan} />;
}
