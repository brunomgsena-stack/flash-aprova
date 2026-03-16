import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSubjectIcon } from '@/lib/iconMap';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ deckId: string }> };

type DeckWithSubject = {
  id:    string;
  title: string;
  subjects: {
    id:       string;
    title:    string;
    color:    string | null;
    icon_url: string | null;
    category: string | null;
  } | null;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getDeck(deckId: string): Promise<DeckWithSubject | null> {
  const { data } = await supabase
    .from('decks')
    .select('id, title, subjects(id, title, color, icon_url, category)')
    .eq('id', deckId)
    .single();
  return (data as DeckWithSubject | null) ?? null;
}

// ─── Category colors ──────────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<string, string> = {
  'Ciências da Natureza': '#00e5ff',
  'Ciências Humanas':     '#a855f7',
  'Linguagens e Códigos': '#f97316',
  'Matemática':           '#00ff80',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DeckPreStudyPage({ params }: Props) {
  const { deckId } = await params;
  const deck = await getDeck(deckId);
  if (!deck || !deck.subjects) notFound();

  const subject  = deck.subjects;
  const color    = subject.color ?? '#7C3AED';
  const catColor = CATEGORY_COLOR[subject.category ?? ''] ?? color;
  const icon     = getSubjectIcon(subject.title, subject.icon_url, subject.category);

  const sections = [
    {
      icon:  '📝',
      title: 'Resumo Teórico',
      desc:  `Síntese dos principais conceitos de "${deck.title}".`,
      color: '#00e5ff',
    },
    {
      icon:  '🎧',
      title: 'Áudio-Resumo',
      desc:  'Ouça um resumo narrado enquanto se prepara para a revisão.',
      color: '#a855f7',
    },
    {
      icon:  '📊',
      title: 'Tabelas Comparativas',
      desc:  'Diferenças, fórmulas e macetes lado a lado para fixar.',
      color: '#f97316',
    },
  ];

  return (
    <main className="min-h-screen px-4 py-12 sm:px-8">
      <div className="max-w-3xl mx-auto">

        {/* ── Breadcrumbs ─────────────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-8 flex-wrap">
          <Link href="/dashboard" className="hover:text-white transition-colors">
            Dashboard
          </Link>
          {subject.category && (
            <>
              <span className="opacity-40">›</span>
              <span style={{ color: catColor }}>{subject.category}</span>
            </>
          )}
          <span className="opacity-40">›</span>
          <Link
            href={`/dashboard/subject/${subject.id}`}
            className="hover:text-white transition-colors"
          >
            {subject.title}
          </Link>
          <span className="opacity-40">›</span>
          <span className="text-white font-medium">{deck.title}</span>
        </nav>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-5 mb-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{
              background: `${color}22`,
              border:     `1px solid ${color}55`,
              boxShadow:  `0 0 24px ${color}33`,
            }}
          >
            {icon}
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color }}>
              {subject.title}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {deck.title}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Base de Conhecimento</p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full mb-10 mt-6"
          style={{ background: `linear-gradient(90deg, ${color}55, transparent)` }}
        />

        {/* ── Content sections ────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 mb-10">
          {sections.map((s) => (
            <div
              key={s.title}
              className="relative rounded-2xl p-6 flex items-start gap-5 overflow-hidden"
              style={{
                background:           'rgba(255,255,255,0.03)',
                backdropFilter:       'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border:               '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {/* Left accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl"
                style={{ background: s.color }}
              />

              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: `${s.color}14`, border: `1px solid ${s.color}33` }}
              >
                {s.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-white font-semibold">{s.title}</h2>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      color:      s.color,
                      background: `${s.color}14`,
                      border:     `1px solid ${s.color}33`,
                    }}
                  >
                    Em breve
                  </span>
                </div>
                <p className="text-slate-400 text-sm">{s.desc}</p>

                {/* Skeleton placeholder */}
                <div
                  className="mt-3 h-1.5 rounded-full w-3/4"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <div
          className="relative rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5 overflow-hidden"
          style={{
            background: `${color}08`,
            border:     `1px solid ${color}33`,
            boxShadow:  `0 0 30px ${color}10`,
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }}
          />

          <div className="flex-1 text-center sm:text-left">
            <p className="text-white font-bold text-lg">Pronto para revisar?</p>
            <p className="text-slate-400 text-sm mt-0.5">
              Inicie sua sessão de repetição espaçada para <span className="text-white">{deck.title}</span>.
            </p>
          </div>

          <Link
            href={`/study/${deckId}`}
            className="shrink-0 px-8 py-3.5 rounded-xl font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 whitespace-nowrap"
            style={{
              background: `linear-gradient(135deg, ${color}cc, ${color}88)`,
              boxShadow:  `0 0 24px ${color}44, 0 4px 12px rgba(0,0,0,0.4)`,
            }}
          >
            Iniciar Flashcards →
          </Link>
        </div>

      </div>
    </main>
  );
}
