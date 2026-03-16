import { supabase } from './supabaseClient';

export type Plan = 'flash' | 'proai_plus';

export type PlanInfo = {
  plan:      Plan;
  expiresAt: Date | null;
  /** null = no expiry date stored */
  daysLeft:  number | null;
};

const PLAN_LABEL: Record<Plan, string> = {
  flash:      'Flash',
  proai_plus: 'ProAI+',
};

export function planLabel(plan: Plan): string {
  return PLAN_LABEL[plan];
}

export async function fetchUserPlan(userId: string): Promise<PlanInfo> {
  const { data } = await supabase
    .from('user_stats')
    .select('plan, plan_expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  const plan      = (data?.plan as Plan | undefined) ?? 'flash';
  const expiresAt = data?.plan_expires_at ? new Date(data.plan_expires_at) : null;

  let daysLeft: number | null = null;
  if (expiresAt) {
    daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 864e5));
  }

  return { plan, expiresAt, daysLeft };
}
