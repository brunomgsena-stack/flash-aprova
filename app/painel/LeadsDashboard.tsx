'use client';

export type Lead = { id: string; name: string; email: string; whatsapp: string; created_at: string };
export type PanelData = {
  leads: Lead[];
  metrics: { total: number; hoje: number; ultimos7d: number; ultimos30d: number; porDia: { dia: string; count: number }[] };
  totalContas: number;
  assinaturasPagas: number;
};

export default function LeadsDashboard({ data }: { data: PanelData }) {
  return <pre style={{ padding: 40, color: '#0f0', background: '#000', minHeight: '100vh' }}>{JSON.stringify(data.metrics, null, 2)}</pre>;
}
