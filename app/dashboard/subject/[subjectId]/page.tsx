import { supabase } from '@/lib/supabaseClient';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSubjectIcon } from '@/lib/iconMap';
import { getCategoryInfo } from '@/lib/categories';
import ModuleAccordion from './ModuleAccordion';
import DeckCard from './DeckCard';
import RevisaoFlash from './RevisaoFlash';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ subjectId: string }> };

type Subject = {
  id:       string;
  title:    string;
  color:    string | null;
  icon_url: string | null;
  category: string | null;
};

type ModuleRow = {
  id:          string;
  title:       string;
  order_index: number;
  decks: {
    id:    string;
    title: string;
  }[];
};

type DeckRow = {
  id:        string;
  title:     string;
  module_id: string | null;
};

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getSubject(subjectId: string): Promise<Subject | null> {
  const { data } = await supabase
    .from('subjects')
    .select('id, title, color, icon_url, category')
    .eq('id', subjectId)
    .single();
  return data ?? null;
}

async function getModules(subjectId: string): Promise<ModuleRow[]> {
  const { data } = await supabase
    .from('modules')
    .select('id, title, order_index, decks(id, title)')
    .eq('subject_id', subjectId)
    .order('order_index');
  if (!data) return [];
  // Normalise Supabase FK join (may return array or object)
  return data.map(m => ({
    ...m,
    decks: Array.isArray(m.decks) ? m.decks : m.decks ? [m.decks] : [],
  }));
}

async function getDecksWithoutModule(subjectId: string): Promise<DeckRow[]> {
  const { data } = await supabase
    .from('decks')
    .select('id, title, module_id')
    .eq('subject_id', subjectId)
    .is('module_id', null)
    .order('title');
  return data ?? [];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SubjectPage({ params }: Props) {
  const { subjectId } = await params;

  // Synthetic subject — dedicated page
  if (subjectId === 'redacao-flash') redirect('/dashboard/content/redacao');

  const [subject, modules, orphanDecks] = await Promise.all([
    getSubject(subjectId),
    getModules(subjectId),
    getDecksWithoutModule(subjectId),
  ]);

  if (!subject) notFound();

  const color    = subject.color ?? '#7C3AED';
  const icon     = getSubjectIcon(subject.title, subject.icon_url, subject.category);
  const catInfo  = getCategoryInfo(subject.category);

  const hasModules   = modules.length > 0;
  const totalDecks   = hasModules
    ? modules.reduce((n, m) => n + m.decks.length, 0) + orphanDecks.length
    : orphanDecks.length;

  return (
    <main className="min-h-screen px-4 py-12 sm:px-8">
      <div className="max-w-3xl mx-auto">

        {/* ── Breadcrumbs ───────────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-8 flex-wrap">
          <Link href="/dashboard" className="hover:text-white transition-colors">
            Dashboard
          </Link>
          <span className="opacity-40">›</span>
          <span style={{ color: catInfo.color }}>{catInfo.short}</span>
          <span className="opacity-40">›</span>
          <span className="text-white font-medium">{subject.title}</span>
        </nav>

        {/* ── Header ────────────────────────────────────────────────── */}
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
              {subject.category ?? 'Matéria'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {subject.title}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {hasModules
                ? `${modules.length} módulo${modules.length !== 1 ? 's' : ''} · ${totalDecks} deck${totalDecks !== 1 ? 's' : ''}`
                : totalDecks === 0
                  ? 'Nenhum deck disponível ainda.'
                  : `${totalDecks} deck${totalDecks !== 1 ? 's' : ''} disponível${totalDecks !== 1 ? 'is' : ''}`
              }
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full mb-8 mt-6"
          style={{ background: `linear-gradient(90deg, ${color}55, transparent)` }}
        />

        {/* ── RevisãoFlash ──────────────────────────────────────────── */}
        <RevisaoFlash subjectId={subject.id} color={color} />

        {/* ── Module accordion ──────────────────────────────────────── */}
        {hasModules && (
          <>
            <p className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4">
              Módulos
            </p>
            <ModuleAccordion modules={modules} color={color} />
          </>
        )}

        {/* ── Orphan decks (fallback) ────────────────────────────────── */}
        {orphanDecks.length > 0 && (
          <>
            <p className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4 mt-8">
              {hasModules ? 'Outros Decks' : 'Introdução'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {orphanDecks.map(deck => (
                <DeckCard
                  key={deck.id}
                  id={deck.id}
                  title={deck.title}
                  color={color}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Empty state ───────────────────────────────────────────── */}
        {!hasModules && orphanDecks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="text-5xl">🃏</span>
            <p className="text-slate-500 text-lg">Nenhum deck por aqui ainda.</p>
          </div>
        )}

      </div>
    </main>
  );
}
