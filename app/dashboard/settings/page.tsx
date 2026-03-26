'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const VIOLET = '#8B5CF6';
const NEON   = '#10B981';

const AREAS = [
  { id: 'Natureza',   icon: '🔬', label: 'Ciências da Natureza' },
  { id: 'Humanas',    icon: '🏛️', label: 'Ciências Humanas' },
  { id: 'Linguagens', icon: '📚', label: 'Linguagens' },
  { id: 'Matemática', icon: '📐', label: 'Matemática' },
];

export default function SettingsPage() {
  const router = useRouter();

  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
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
        .single();

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
    setSaving(true);
    await supabase.from('profiles').upsert(
      {
        id:                  userId,
        target_course:       course.trim()     || null,
        target_university:   university.trim() || null,
        daily_card_goal:     goal,
        difficulty_subjects: difficulties,
      },
      { onConflict: 'id' },
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 animate-spin"
          style={{ borderColor: VIOLET, borderTopColor: 'transparent' }} />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-12 sm:px-8">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs font-semibold text-slate-500 hover:text-white transition-colors mb-4 flex items-center gap-1"
          >
            ← Dashboard
          </button>
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: VIOLET }}>
            Configurações
          </p>
          <h1 className="text-2xl font-black text-white">Perfil de Estudos</h1>
          <p className="text-slate-500 text-sm mt-1">
            Ajuste suas metas e o FlashTutor recalibra sua rota de aprovação.
          </p>
        </div>

        <div className="flex flex-col gap-6">

          {/* Curso e Universidade */}
          <Section title="Seu Alvo">
            <Field label="Curso dos Sonhos">
              <input
                value={course}
                onChange={e => setCourse(e.target.value)}
                placeholder="Ex: Medicina, Direito..."
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.12)`, caretColor: VIOLET }}
              />
            </Field>
            <Field label="Universidade dos Sonhos">
              <input
                value={university}
                onChange={e => setUniversity(e.target.value)}
                placeholder="Ex: USP, UFPE, UNICAMP..."
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.12)`, caretColor: VIOLET }}
              />
            </Field>
          </Section>

          {/* Meta diária */}
          <Section title="Meta Diária de Cards">
            <div className="grid grid-cols-4 gap-2">
              {([25, 50, 75, 100] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className="py-3 rounded-xl text-sm font-bold transition-all duration-200"
                  style={
                    goal === g
                      ? { background: `${VIOLET}25`, border: `1px solid ${VIOLET}70`, color: '#fff', boxShadow: `0 0 12px ${VIOLET}30` }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.40)' }
                  }
                >
                  {g}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">{goal} cards por dia · sessão RevisãoFlash padrão</p>
          </Section>

          {/* Áreas de dificuldade */}
          <Section title="Áreas de Dificuldade">
            <div className="flex flex-col gap-2">
              {AREAS.map(area => {
                const selected = difficulties.includes(area.id);
                return (
                  <button
                    key={area.id}
                    onClick={() => toggleArea(area.id)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 text-left"
                    style={
                      selected
                        ? { background: `${VIOLET}18`, border: `1px solid ${VIOLET}60` }
                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                  >
                    <span className="text-lg">{area.icon}</span>
                    <span className="text-sm font-semibold text-white flex-1">{area.label}</span>
                    {selected && <span className="text-xs font-bold" style={{ color: NEON }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-xl font-black text-sm text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
            style={{
              background: saved
                ? `linear-gradient(135deg, ${NEON}, #059669)`
                : `linear-gradient(135deg, ${VIOLET}, #6d28d9)`,
              boxShadow: saved ? `0 0 20px ${NEON}40` : `0 0 20px ${VIOLET}40`,
            }}
          >
            {saving ? 'Salvando…' : saved ? '✓ Salvo com sucesso!' : 'Salvar Configurações'}
          </button>

        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: VIOLET }}>
        {title}
      </p>
      <div className="flex flex-col gap-3">{children}</div>
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
