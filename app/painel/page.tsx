import { hasPanelAccess } from '@/lib/admin-panel-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { currentStage, type LeadStage } from '@/lib/lead-events';
import PanelLogin from './PanelLogin';
import LeadsDashboard, { type Lead, type LeadEvent, type PanelData } from './LeadsDashboard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Painel de Leads — FlashAprova' };

function buildPanelData(
  leads: Lead[],
  totalContas: number,
  assinaturasPagas: number,
): PanelData {
  const now = new Date();
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const d7 = now.getTime() - 7 * 864e5;
  const d30 = now.getTime() - 30 * 864e5;

  let hoje = 0, ultimos7d = 0, ultimos30d = 0;
  const porDiaMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 864e5);
    porDiaMap.set(d.toISOString().slice(0, 10), 0);
  }
  const stageCounts: Record<LeadStage, number> = {
    'Pagou': 0,
    'Iniciou checkout': 0,
    'Carrinho': 0,
    'Cadastrou': 0,
    'Onboarding': 0,
    'Lead': 0,
  };

  for (const l of leads) {
    const t = new Date(l.created_at).getTime();
    if (t >= startOfToday) hoje++;
    if (t >= d7) ultimos7d++;
    if (t >= d30) ultimos30d++;
    const key = new Date(l.created_at).toISOString().slice(0, 10);
    if (porDiaMap.has(key)) porDiaMap.set(key, (porDiaMap.get(key) ?? 0) + 1);
    stageCounts[l.stage]++;
  }

  return {
    leads,
    metrics: {
      total: leads.length,
      hoje,
      ultimos7d,
      ultimos30d,
      porDia: [...porDiaMap.entries()].map(([dia, count]) => ({ dia, count })),
    },
    totalContas,
    assinaturasPagas,
    stageCounts,
  };
}

export default async function PainelPage() {
  if (!(await hasPanelAccess())) {
    return <PanelLogin />;
  }

  const supabase = createAdminClient();

  const { data: leadsRaw } = await supabase
    .from('leads')
    .select('id, name, email, whatsapp, created_at')
    .order('created_at', { ascending: false })
    .limit(5000);

  const { data: eventsRaw } = await supabase
    .from('lead_events')
    .select('id, email, event_name, occurred_at, metadata')
    .order('occurred_at', { ascending: false })
    .limit(20000);

  const { count: totalContas } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  const { count: pagasCount, error: pagasError } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .not('plan', 'in', '("flash","aceleracao")');
  const assinaturasPagas = pagasError ? 0 : (pagasCount ?? 0);

  // Agrupa eventos por email lowercased
  const eventsByEmail = new Map<string, LeadEvent[]>();
  for (const ev of (eventsRaw ?? [])) {
    const key = (ev.email as string).trim().toLowerCase();
    const list = eventsByEmail.get(key) ?? [];
    list.push({
      id: ev.id as string,
      event_name: ev.event_name as string,
      occurred_at: ev.occurred_at as string,
      metadata: (ev.metadata as Record<string, unknown> | null) ?? null,
    });
    eventsByEmail.set(key, list);
  }

  // Anexa events + stage em cada lead
  const leads: Lead[] = (leadsRaw ?? []).map((l) => {
    const key = (l.email as string).trim().toLowerCase();
    const events = eventsByEmail.get(key) ?? [];
    return {
      id: l.id as string,
      name: l.name as string,
      email: l.email as string,
      whatsapp: l.whatsapp as string,
      created_at: l.created_at as string,
      events,
      stage: currentStage(events),
    };
  });

  const data = buildPanelData(leads, totalContas ?? 0, assinaturasPagas);

  return <LeadsDashboard data={data} />;
}
