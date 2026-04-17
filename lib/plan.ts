import { supabase } from './supabaseClient';

export type Plan = 'aceleracao' | 'panteao_elite';

export type PlanInfo = {
  plan:      Plan;
  expiresAt: Date | null;
  /** null = no expiry date stored */
  daysLeft:  number | null;
};

const PLAN_LABEL: Record<Plan, string> = {
  aceleracao:    'Aceleração',
  panteao_elite: 'Panteão Elite',
};

export function planLabel(plan: Plan): string {
  return PLAN_LABEL[plan];
}

export async function fetchUserPlan(userId: string): Promise<PlanInfo> {
  // Queries paralelas: plano + role (admin bypass)
  const [statsResult, profileResult] = await Promise.all([
    supabase
      .from('user_stats')
      .select('plan, plan_expires_at')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle(),
  ]);

  // Admin bypass: acesso total independente do plano cadastrado
  if (profileResult.data?.role === 'admin') {
    return { plan: 'panteao_elite', expiresAt: null, daysLeft: null };
  }

  const data     = statsResult.data;
  const rawPlan  = (data?.plan as Plan | undefined) ?? 'aceleracao';
  const expiresAt = data?.plan_expires_at ? new Date(data.plan_expires_at) : null;

  // Plano expirado → rebaixa para 'aceleracao'
  const now = new Date();
  if (expiresAt && expiresAt < now) {
    return { plan: 'aceleracao', expiresAt, daysLeft: 0 };
  }

  let daysLeft: number | null = null;
  if (expiresAt) {
    daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 864e5));
  }

  return { plan: rawPlan, expiresAt, daysLeft };
}
