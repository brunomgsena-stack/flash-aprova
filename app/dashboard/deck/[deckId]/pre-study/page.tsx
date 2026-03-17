import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSubjectIcon } from '@/lib/iconMap';
import { getCategoryInfo } from '@/lib/categories';
import { fetchUserPlan } from '@/lib/plan';
import { createClient } from '@/lib/supabase/server';
import DeckContent from './DeckContent';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ deckId: string }> };

type DeckWithSubject = {
  id:                     string;
  title:                  string;
  module_id:              string | null;
  summary_markdown:       string | null;
  comparative_table_json: unknown;
  mnemonics:              string | null;
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
    .select(`
      id, title, module_id,
      summary_markdown, comparative_table_json, mnemonics,
      subjects(id, title, color, icon_url, category)
    `)
    .eq('id', deckId)
    .single();
  return (data as DeckWithSubject | null) ?? null;
}

async function getModuleTitle(moduleId: string): Promise<string | null> {
  const { data } = await supabase
    .from('modules')
    .select('title')
    .eq('id', moduleId)
    .single();
  return data?.title ?? null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DeckPreStudyPage({ params }: Props) {
  const { deckId } = await params;
  const deck = await getDeck(deckId);
  if (!deck || !deck.subjects) notFound();

  const subject     = deck.subjects;
  const color       = subject.color ?? '#7C3AED';
  const catInfo     = getCategoryInfo(subject.category);
  const icon        = getSubjectIcon(subject.title, subject.icon_url, subject.category);
  const moduleTitle = deck.module_id ? await getModuleTitle(deck.module_id) : null;

  // Fetch user plan server-side
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  const planInfo = user ? await fetchUserPlan(user.id, user.email ?? undefined) : null;
  const plan = planInfo?.plan ?? 'flash';

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
              <span style={{ color: catInfo.color }}>{catInfo.short}</span>
            </>
          )}
          <span className="opacity-40">›</span>
          <Link
            href={`/dashboard/subject/${subject.id}`}
            className="hover:text-white transition-colors"
          >
            {subject.title}
          </Link>
          {moduleTitle && (
            <>
              <span className="opacity-40">›</span>
              <span className="capitalize" style={{ color: `${color}cc` }}>
                {moduleTitle}
              </span>
            </>
          )}
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
          className="h-px w-full mt-6 mb-6"
          style={{ background: `linear-gradient(90deg, ${color}55, transparent)` }}
        />

        {/* ── CTA — prominent, above the material ─────────────────────── */}
        <div
          className="relative rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 overflow-hidden mb-8"
          style={{
            background: 'rgba(16, 185, 129, 0.07)',
            border:     '1px solid rgba(16, 185, 129, 0.30)',
            boxShadow:  '0 0 28px rgba(16,185,129,0.08)',
          }}
        >
          {/* Top shimmer line */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.50), transparent)' }}
          />

          <div className="flex-1 text-center sm:text-left">
            <p className="text-white font-bold text-base">Pronto para revisar?</p>
            <p className="text-slate-400 text-sm mt-0.5">
              Inicie sua sessão de repetição espaçada agora.
            </p>
          </div>

          <Link
            href={`/study/${deckId}`}
            className="shrink-0 flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-white text-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03] whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow:  '0 0 20px rgba(16,185,129,0.40), 0 4px 12px rgba(0,0,0,0.35)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <polygon points="3,1 15,8 3,15" fill="white"/>
            </svg>
            Iniciar Flashcards
          </Link>
        </div>

        {/* ── Separador "Base de Conhecimento" ────────────────────────── */}
        <p className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4">
          Base de Conhecimento
        </p>

        {/* ── Content sections (accordion) ─────────────────────────────── */}
        <DeckContent
          color={color}
          plan={plan}
          subjectTitle={subject.title}
          deckTitle={deck.title}
          summary_markdown={deck.summary_markdown}
          comparative_table_json={deck.comparative_table_json}
          mnemonics={deck.mnemonics}
        />

      </div>
    </main>
  );
}
