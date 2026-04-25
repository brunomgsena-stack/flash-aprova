'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const V = '#8B5CF6';
const C = '#06b6d4';

const INTENSITY_TIERS = [
  { value: 25,  label: 'Manutenção',  desc: '~15 min/dia', sub: 'Para não perder o ritmo' },
  { value: 50,  label: 'Consistente', desc: '~25 min/dia', sub: 'Padrão de aprovação', recommended: true },
  { value: 75,  label: 'Intensivo',   desc: '~40 min/dia', sub: 'Pressão alta' },
  { value: 100, label: 'Elite',       desc: '~55 min/dia', sub: 'Modo maratona' },
] as const;

const AREAS = [
  { id: 'Natureza',   icon: '🔬', label: 'Ciências da Natureza', sub: 'Biologia, Física, Química — 45 questões no ENEM' },
  { id: 'Humanas',    icon: '🏛️', label: 'Ciências Humanas',    sub: 'História, Geo, Filosofia, Sociologia — 45 questões' },
  { id: 'Linguagens', icon: '📖', label: 'Linguagens',           sub: 'Português, Literatura, Inglês — 45 questões' },
  { id: 'Matemática', icon: '📐', label: 'Matemática',           sub: 'Aritmética, Geometria, Funções — 45 questões' },
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function SettingsPage() {
  const router = useRouter();

  const [loading,      setLoading]      = useState(true);
  const [saveStatus,   setSaveStatus]   = useState<SaveStatus>('idle');
  const [userId,       setUserId]       = useState<string | null>(null);

  const [course,       setCourse]       = useState('');
  const [university,   setUniversity]   = useState('');
  const [goal,         setGoal]         = useState(50);
  const [difficulties, setDifficulties] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from('profiles')
        .select('target_course, target_university, daily_card_goal, difficulty_subjects')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setCourse(data.target_course ?? '');
        setUniversity(data.target_university ?? '');
        setGoal(data.daily_card_goal ?? 50);
        setDifficulties((data.difficulty_subjects as string[]) ?? []);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  function toggleArea(id: string) {
    setDifficulties(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id],
    );
  }

  async function handleSave() {
    if (!userId) return;
    setSaveStatus('saving');

    const { error } = await supabase
      .from('profiles')
      .update({
        target_course:       course.trim()     || null,
        target_university:   university.trim() || null,
        daily_card_goal:     goal,
        difficulty_subjects: difficulties,
      })
      .eq('id', userId);

    if (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    setSaveStatus('saved');
    setTimeout(() => {
      router.push('/dashboard');
    }, 1400);
  }

  const selectedTier = INTENSITY_TIERS.find(t => t.value === goal) ?? INTENSITY_TIERS[1];

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 animate-spin"
          style={{ borderColor: V, borderTopColor: 'transparent' }} />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-8">
      <div className="max-w-xl mx-auto">

        {/* Nav */}
        <button
          onClick={() => router.push('/dashboard')}
          className="text-xs font-semibold text-slate-500 hover:text-white transition-colors mb-8 flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: V }}>
            Perfil de Estudos
          </p>
          <h1 className="text-3xl font-black text-white leading-tight">Configure sua Missão</h1>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Esses dados calibram seus Insights, Agenda e Tutores IA. Quanto mais preciso, mais afiada sua rota de aprovação.
          </p>
        </div>

        {/* Mission preview card */}
        {(course || university) && (
          <div
            className="relative rounded-2xl p-4 mb-6 overflow-hidden"
            style={{ background: `linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.08))`, border: `1px solid rgba(139,92,246,0.25)` }}
          >
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)` }} />
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: V }}>Missão Atual</p>
            <div className="flex items-center gap-3">
              <div className="text-2xl select-none">🎯</div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">
                  {course || '—'}{university ? ` · ${university}` : ''}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">{selectedTier.label} · {goal} cards/dia · {selectedTier.desc}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-5">

          {/* Alvo */}
          <Card label="Seu Alvo">
            <p className="text-slate-500 text-xs mb-4 leading-relaxed">
              Usado pelos Insights IA e pelo Relatório de Progresso para calcular a afinidade das suas notas com o curso desejado.
            </p>
            <div className="flex flex-col gap-3">
              <Field label="Curso">
                <input
                  value={course}
                  onChange={e => setCourse(e.target.value)}
                  placeholder="Ex: Medicina, Direito, Engenharia..."
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-200 focus:ring-1"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.10)`, caretColor: V }}
                  onFocus={e => (e.currentTarget.style.borderColor = `${V}80`)}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
                />
              </Field>
              <Field label="Universidade">
                <input
                  value={university}
                  onChange={e => setUniversity(e.target.value)}
                  placeholder="Ex: USP, UFPE, UNICAMP, UFRJ..."
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.10)`, caretColor: V }}
                  onFocus={e => (e.currentTarget.style.borderColor = `${V}80`)}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
                />
              </Field>
            </div>
          </Card>

          {/* Ritmo Diário */}
          <Card label="Ritmo Diário">
            <p className="text-slate-500 text-xs mb-4 leading-relaxed">
              Define quantos cards a Agenda Semanal e a sessão de revisão vão te propor por dia.
            </p>
            <div className="flex flex-col gap-2">
              {INTENSITY_TIERS.map(tier => {
                const active = goal === tier.value;
                return (
                  <button
                    key={tier.value}
                    onClick={() => setGoal(tier.value)}
                    className="flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all duration-200 text-left w-full group"
                    style={
                      active
                        ? { background: `rgba(139,92,246,0.14)`, border: `1px solid rgba(139,92,246,0.50)`, boxShadow: `0 0 16px rgba(139,92,246,0.12)` }
                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }
                    }
                  >
                    {/* radio dot */}
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200"
                      style={{
                        border: active ? `2px solid ${V}` : '2px solid rgba(255,255,255,0.20)',
                        background: active ? V : 'transparent',
                      }}
                    >
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    {/* number */}
                    <div
                      className="text-lg font-black w-8 text-right flex-shrink-0 tabular-nums"
                      style={{ color: active ? '#fff' : 'rgba(255,255,255,0.30)' }}
                    >
                      {tier.value}
                    </div>

                    {/* labels */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                          {tier.label}
                        </span>
                        {'recommended' in tier && tier.recommended && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: `rgba(6,182,212,0.15)`, color: C, border: `1px solid rgba(6,182,212,0.30)` }}
                          >
                            Recomendado
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>{tier.sub}</p>
                    </div>

                    {/* time */}
                    <span className="text-xs font-semibold flex-shrink-0" style={{ color: active ? V : 'rgba(255,255,255,0.25)' }}>
                      {tier.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Frentes Fracas */}
          <Card label="Frentes Fracas">
            <p className="text-slate-500 text-xs mb-4 leading-relaxed">
              Seus Insights IA e o Radar ENEM vão destacar essas áreas como prioridade de reforço.
            </p>
            <div className="flex flex-col gap-2">
              {AREAS.map(area => {
                const on = difficulties.includes(area.id);
                return (
                  <button
                    key={area.id}
                    onClick={() => toggleArea(area.id)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-200 text-left w-full"
                    style={
                      on
                        ? { background: 'rgba(139,92,246,0.12)', border: `1px solid rgba(139,92,246,0.45)` }
                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }
                    }
                  >
                    <span className="text-xl flex-shrink-0 w-7 text-center">{area.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white leading-tight">{area.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{area.sub}</p>
                    </div>
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200"
                      style={
                        on
                          ? { background: V, border: `1px solid ${V}` }
                          : { background: 'transparent', border: '1px solid rgba(255,255,255,0.18)' }
                      }
                    >
                      {on && (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 6l3 3 5-5"/>
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Onde isso aparece */}
          <div
            className="rounded-xl px-4 py-3.5 flex flex-col gap-2"
            style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)' }}
          >
            <p className="text-xs font-bold tracking-wider uppercase" style={{ color: C }}>Onde esses dados chegam</p>
            <div className="flex flex-col gap-1.5">
              {[
                { icon: '🧠', text: 'Insights IA — análise personalizada pelo seu alvo' },
                { icon: '📅', text: 'Agenda Semanal — ritmo baseado no seu meta diário' },
                { icon: '📊', text: 'Relatório de Progresso — afinidade com o curso' },
                { icon: '🤖', text: 'Tutores IA — contexto do que você precisa aprovar' },
              ].map(item => (
                <div key={item.text} className="flex items-start gap-2">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs text-slate-400 leading-relaxed">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || saveStatus === 'saved'}
            className="w-full py-4 rounded-xl font-black text-sm text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-70 disabled:translate-y-0"
            style={{
              background:
                saveStatus === 'saved'  ? 'linear-gradient(135deg, #10B981, #059669)' :
                saveStatus === 'error'  ? 'linear-gradient(135deg, #ef4444, #b91c1c)' :
                `linear-gradient(135deg, ${V}, #6d28d9)`,
              boxShadow:
                saveStatus === 'saved'  ? '0 0 24px rgba(16,185,129,0.35)' :
                saveStatus === 'error'  ? '0 0 24px rgba(239,68,68,0.30)' :
                `0 0 24px rgba(139,92,246,0.35)`,
              letterSpacing: '0.03em',
            }}
          >
            {saveStatus === 'saving' ? 'Salvando…' :
             saveStatus === 'saved'  ? '✓ Salvo — voltando ao dashboard…' :
             saveStatus === 'error'  ? 'Erro ao salvar. Tente novamente.' :
             'Salvar Missão'}
          </button>

        </div>
      </div>
    </main>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: V }}>{label}</p>
      <div>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-400 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
