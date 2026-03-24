'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getCategoryShort, ENEM_AREAS } from '@/lib/categories';

type StatusInfo = { dot: string; text: string };

function getDynamicStatus(p: {
  totalDue:   number;
  streak:     number;
  weakArea:   string | null;
  hasHistory: boolean;
}): StatusInfo {
  if (!p.hasHistory)
    return { dot: '#00ff80', text: 'Status: Operacional · Aguardando primeira missão' };
  if (p.totalDue > 100)
    return { dot: '#ef4444', text: `Status: Crise Detectada · ${p.totalDue} frentes de batalha aguardando comando` };
  if (p.weakArea)
    return { dot: '#f97316', text: `Alerta: Inteligência aponta vulnerabilidade crítica em ${p.weakArea}` };
  if (p.streak > 1)
    return { dot: '#00ff80', text: `Status: Em Ritmo de Aprovação · Sequência de ${p.streak} dias ativa` };
  if (p.totalDue === 0)
    return { dot: '#22d3ee', text: 'Status: Perímetro Limpo · Pronto para novos avanços' };
  return { dot: '#00ff80', text: 'Status: Operacional · Analisando lacunas de memória' };
}

export default function DynamicStatus() {
  const [info, setInfo] = useState<StatusInfo>({
    dot: '#00ff80', text: 'Status: Operacional · Analisando lacunas de memória',
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      const [{ data: rawCards }, { data: progressRows }] = await Promise.all([
        supabase.from('cards').select('id, decks(subjects(category))'),
        supabase.from('user_progress')
          .select('card_id, next_review, history')
          .eq('user_id', user.id),
      ]);

      const rows    = progressRows ?? [];
      const progMap = new Map(rows.map(r => [r.card_id, r]));

      // ── Normalize card → category ──────────────────────────────────────────
      type RawSubj = { category: string | null };
      type RawDeck = { subjects: RawSubj | RawSubj[] | null };
      type RawCard = { id: string; decks: RawDeck | RawDeck[] | null };

      const cardCategoryMap = new Map<string, string>();
      for (const rc of (rawCards ?? []) as RawCard[]) {
        const deck = Array.isArray(rc.decks) ? rc.decks[0] : rc.decks;
        if (!deck) continue;
        const subj = Array.isArray(deck.subjects) ? deck.subjects[0] : deck.subjects;
        if (subj?.category) cardCategoryMap.set(rc.id, getCategoryShort(subj.category));
      }

      // ── Total due ─────────────────────────────────────────────────────────
      let totalDue = 0;
      for (const rc of (rawCards ?? []) as RawCard[]) {
        const p = progMap.get(rc.id);
        if (!p || (p.next_review !== null && p.next_review <= today)) totalDue++;
      }

      // ── Streak ────────────────────────────────────────────────────────────
      const dailyCounts = new Map<string, number>();
      let hasHistory = false;
      for (const row of rows) {
        for (const entry of (row.history as Array<{ reviewed_at: string }> | null) ?? []) {
          const day = entry.reviewed_at?.slice(0, 10);
          if (day) { dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1); hasHistory = true; }
        }
      }
      let streak = 0;
      const now = new Date(); now.setHours(0, 0, 0, 0);
      for (let i = 0; i < 365; i++) {
        const d = new Date(now); d.setDate(now.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        if ((dailyCounts.get(iso) ?? 0) > 0) streak++;
        else break;
      }

      // ── Weak area: area with highest due ratio (≥10 total cards) ──────────
      const areaTotal = new Map<string, number>();
      const areaDue   = new Map<string, number>();
      for (const rc of (rawCards ?? []) as RawCard[]) {
        const area = cardCategoryMap.get(rc.id);
        if (!area) continue;
        areaTotal.set(area, (areaTotal.get(area) ?? 0) + 1);
        const p = progMap.get(rc.id);
        if (!p || (p.next_review !== null && p.next_review <= today)) {
          areaDue.set(area, (areaDue.get(area) ?? 0) + 1);
        }
      }
      let weakArea: string | null = null, worstRatio = 0;
      for (const area of ENEM_AREAS) {
        const total = areaTotal.get(area.short) ?? 0;
        const due   = areaDue.get(area.short) ?? 0;
        if (total >= 10) {
          const ratio = due / total;
          if (ratio > 0.70 && ratio > worstRatio) { worstRatio = ratio; weakArea = area.short; }
        }
      }

      setInfo(getDynamicStatus({ totalDue, streak, weakArea, hasHistory }));
    }
    load();
  }, []);

  return (
    <p className="text-slate-400 mt-2 text-base font-mono">
      <span style={{ color: info.dot }}>●</span>{' '}
      {info.text}
    </p>
  );
}
