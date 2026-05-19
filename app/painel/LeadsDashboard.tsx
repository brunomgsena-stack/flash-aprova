'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export type Lead = { id: string; name: string; email: string; whatsapp: string; created_at: string };
export type PanelData = {
  leads: Lead[];
  metrics: { total: number; hoje: number; ultimos7d: number; ultimos30d: number; porDia: { dia: string; count: number }[] };
  totalContas: number;
  assinaturasPagas: number;
};

const VIOLET = '#7C3AED';
const CYAN = '#06b6d4';
const MONO = "'JetBrains Mono', 'Courier New', ui-monospace, monospace";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
function fmtPhone(d: string) {
  const n = (d || '').replace(/\D/g, '');
  if (n.length === 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;
  return d;
}

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: 'rgba(6,3,18,0.7)', border: `1px solid ${VIOLET}35`, borderRadius: 16, padding: 20 }}>
      <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: `${CYAN}aa`, marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 900, color: '#fff' }}>{value}</p>
    </div>
  );
}

export default function LeadsDashboard({ data }: { data: PanelData }) {
  const { leads, metrics, totalContas, assinaturasPagas } = data;
  const [q, setQ] = useState('');
  const [asc, setAsc] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = term
      ? leads.filter((l) =>
          l.name.toLowerCase().includes(term) ||
          l.email.toLowerCase().includes(term) ||
          l.whatsapp.includes(term.replace(/\D/g, '')))
      : leads;
    return [...base].sort((a, b) =>
      asc
        ? +new Date(a.created_at) - +new Date(b.created_at)
        : +new Date(b.created_at) - +new Date(a.created_at));
  }, [leads, q, asc]);

  function exportCsv() {
    const head = ['name', 'email', 'whatsapp', 'created_at'];
    const rows = filtered.map((l) =>
      [l.name, l.email, l.whatsapp, l.created_at]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','));
    const csv = [head.join(','), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function logout() {
    await fetch('/api/admin-panel/logout', { method: 'POST' });
    window.location.reload();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#08040f', color: '#fff', padding: '32px clamp(16px,4vw,48px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontFamily: MONO, fontWeight: 900, fontSize: 24 }}>Painel de Leads</h1>
        <button onClick={logout}
          style={{ fontFamily: MONO, fontSize: 12, color: '#fff', background: 'transparent',
            border: `1px solid ${VIOLET}60`, borderRadius: 10, padding: '8px 16px', cursor: 'pointer' }}>
          Sair
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 24 }}>
        <Card label="TOTAL LEADS" value={metrics.total} />
        <Card label="HOJE" value={metrics.hoje} />
        <Card label="ÚLTIMOS 7 DIAS" value={metrics.ultimos7d} />
        <Card label="ÚLTIMOS 30 DIAS" value={metrics.ultimos30d} />
        <Card label="CONTAS CRIADAS" value={totalContas} />
        <Card label="ASSINATURAS PAGAS" value={assinaturasPagas} />
      </div>

      <div style={{ background: 'rgba(6,3,18,0.7)', border: `1px solid ${VIOLET}35`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: `${CYAN}aa`, marginBottom: 12 }}>CAPTAÇÃO — ÚLTIMOS 30 DIAS</p>
        <div style={{ width: '100%', height: 160 }}>
          <ResponsiveContainer>
            <BarChart data={metrics.porDia}>
              <XAxis dataKey="dia" hide />
              <Tooltip
                contentStyle={{ background: '#08040f', border: `1px solid ${VIOLET}`, fontFamily: MONO, fontSize: 12 }}
                labelStyle={{ color: CYAN }} />
              <Bar dataKey="count" fill={VIOLET} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="buscar nome / email / telefone"
          style={{ flex: 1, minWidth: 220, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.55)',
            border: `1px solid ${VIOLET}40`, color: '#fff', fontFamily: MONO, outline: 'none' }}
        />
        <button onClick={() => setAsc((v) => !v)}
          style={{ fontFamily: MONO, fontSize: 12, color: '#fff', background: 'transparent',
            border: `1px solid ${VIOLET}60`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer' }}>
          Data {asc ? '↑ antigos' : '↓ recentes'}
        </button>
        <button onClick={exportCsv}
          style={{ fontFamily: MONO, fontSize: 12, color: '#fff', fontWeight: 900,
            background: `linear-gradient(135deg, ${VIOLET}, #5b21b6)`, border: `1px solid ${VIOLET}90`,
            borderRadius: 10, padding: '10px 18px', cursor: 'pointer' }}>
          ⬇ Exportar CSV ({filtered.length})
        </button>
      </div>

      <div style={{ overflowX: 'auto', border: `1px solid ${VIOLET}30`, borderRadius: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'rgba(124,58,237,0.12)' }}>
              {['Nome', 'E-mail', 'WhatsApp', 'Data'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: `${CYAN}cc`, fontSize: 11, letterSpacing: '0.12em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#666' }}>Nenhum lead encontrado.</td></tr>
            ) : filtered.map((l) => (
              <tr key={l.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ padding: '12px 16px' }}>{l.name}</td>
                <td style={{ padding: '12px 16px', color: CYAN }}>{l.email}</td>
                <td style={{ padding: '12px 16px' }}>{fmtPhone(l.whatsapp)}</td>
                <td style={{ padding: '12px 16px', color: '#aaa' }}>{fmtDate(l.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
