'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { type LeadStage } from '@/lib/lead-events';

export type LeadEvent = {
  id: string;
  event_name: string;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  created_at: string;
  events: LeadEvent[];
  stage: LeadStage;
};

export type PanelData = {
  leads: Lead[];
  metrics: { total: number; hoje: number; ultimos7d: number; ultimos30d: number; porDia: { dia: string; count: number }[] };
  totalContas: number;
  assinaturasPagas: number;
  stageCounts: Record<LeadStage, number>;
};

const STAGE_COLOR: Record<LeadStage, string> = {
  'Pagou':             '#22c55e',
  'Iniciou checkout':  '#f59e0b',
  'Carrinho':          '#f97316',
  'Cadastrou':         '#3b82f6',
  'Onboarding':        '#06b6d4',
  'Lead':              '#6b7280',
};

const STAGE_ORDER: LeadStage[] = [
  'Pagou', 'Iniciou checkout', 'Carrinho', 'Cadastrou', 'Onboarding', 'Lead',
];

const EVENT_LABEL: Record<string, string> = {
  Purchase:             'Pagou',
  InitiateCheckout:     'Iniciou checkout',
  AddToCart:            'Adicionou ao carrinho',
  CompleteRegistration: 'Criou conta',
  OnboardingCompleted:  'Completou onboarding',
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

function waLink(phone: string, name: string) {
  const n = (phone || '').replace(/\D/g, '');
  const num = n.startsWith('55') ? n : `55${n}`;
  const msg = encodeURIComponent(`Fala, ${name}! Vai fazer ENEM?`);
  return `https://wa.me/${num}?text=${msg}`;
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
  const { leads, metrics, totalContas, assinaturasPagas, stageCounts } = data;
  const [q, setQ] = useState('');
  const [asc, setAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<LeadStage | 'Todos'>('Todos');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let base = term
      ? leads.filter((l) =>
          l.name.toLowerCase().includes(term) ||
          l.email.toLowerCase().includes(term) ||
          l.whatsapp.includes(term.replace(/\D/g, '')))
      : leads;
    if (stageFilter !== 'Todos') {
      base = base.filter((l) => l.stage === stageFilter);
    }
    return [...base].sort((a, b) =>
      asc
        ? +new Date(a.created_at) - +new Date(b.created_at)
        : +new Date(b.created_at) - +new Date(a.created_at));
  }, [leads, q, asc, stageFilter]);

  function exportCsv() {
    const head = ['name', 'email', 'whatsapp', 'created_at', 'stage', 'events_count'];
    const rows = filtered.map((l) =>
      [l.name, l.email, l.whatsapp, l.created_at, l.stage, String(l.events.length)]
        .map((v) => `"${String(v).replace(/[\r\n]+/g, ' ').replace(/"/g, '""')}"`)
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 24 }}>
        {STAGE_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setStageFilter((cur) => (cur === s ? 'Todos' : s))}
            style={{
              background: stageFilter === s ? `${STAGE_COLOR[s]}22` : 'rgba(6,3,18,0.7)',
              border: `1px solid ${STAGE_COLOR[s]}${stageFilter === s ? 'aa' : '40'}`,
              borderRadius: 12,
              padding: '10px 14px',
              cursor: 'pointer',
              textAlign: 'left',
              color: '#fff',
              fontFamily: MONO,
            }}>
            <p style={{ fontSize: 9, letterSpacing: '0.12em', color: `${STAGE_COLOR[s]}`, marginBottom: 4, textTransform: 'uppercase' }}>{s}</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{stageCounts[s]}</p>
          </button>
        ))}
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
              {['Nome', 'E-mail', 'WhatsApp', 'Estágio', 'Data', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: `${CYAN}cc`, fontSize: 11, letterSpacing: '0.12em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#666' }}>Nenhum lead encontrado.</td></tr>
            ) : filtered.map((l) => {
              const isOpen = expandedId === l.id;
              return (
                <>
                  <tr
                    key={l.id}
                    onClick={() => setExpandedId(isOpen ? null : l.id)}
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', background: isOpen ? 'rgba(124,58,237,0.06)' : 'transparent' }}>
                    <td style={{ padding: '12px 16px' }}>{l.name}</td>
                    <td style={{ padding: '12px 16px', color: CYAN }}>{l.email}</td>
                    <td style={{ padding: '12px 16px' }}>{fmtPhone(l.whatsapp)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                        background: `${STAGE_COLOR[l.stage]}22`, color: STAGE_COLOR[l.stage],
                        border: `1px solid ${STAGE_COLOR[l.stage]}66`, fontSize: 11, fontWeight: 700,
                      }}>{l.stage}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#aaa' }}>{fmtDate(l.created_at)}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <a href={waLink(l.whatsapp, l.name)} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'inline-block', fontFamily: MONO, fontSize: 11, fontWeight: 700,
                          color: '#fff', background: '#25D366', border: 'none', borderRadius: 8,
                          padding: '6px 12px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        WA
                      </a>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${l.id}-detail`} style={{ background: 'rgba(124,58,237,0.04)' }}>
                      <td colSpan={6} style={{ padding: '12px 24px 16px' }}>
                        {l.events.length === 0 ? (
                          <p style={{ color: '#666', fontSize: 12 }}>Sem eventos registrados além da captação como lead.</p>
                        ) : (
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12 }}>
                            {l.events.map((ev) => (
                              <li key={ev.id} style={{ padding: '4px 0', color: '#ccc' }}>
                                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4,
                                  background: STAGE_COLOR[(EVENT_LABEL[ev.event_name] as LeadStage) ?? 'Lead'] ?? '#6b7280',
                                  marginRight: 10 }} />
                                <strong style={{ color: '#fff' }}>{EVENT_LABEL[ev.event_name] ?? ev.event_name}</strong>
                                <span style={{ color: '#888', marginLeft: 8 }}>{fmtDate(ev.occurred_at)}</span>
                                {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                                  <span style={{ color: '#888', marginLeft: 8 }}>
                                    — {Object.entries(ev.metadata).map(([k, v]) => `${k}: ${String(v)}`).join(', ')}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
