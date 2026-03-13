import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import DeckCard from './DeckCard';

// ─── Types ───────────────────────────────────────────────────────────────────

type Subject = {
  id: string;
  title: string;
  color: string | null;
  icon_url: string | null;
};

type Deck = {
  id: string;
  title: string;
};

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getSubject(subjectId: string): Promise<Subject | null> {
  const { data } = await supabase
    .from('subjects')
    .select('id, title, color, icon_url')
    .eq('id', subjectId)
    .single();
  return data ?? null;
}

async function getDecks(subjectId: string): Promise<Deck[]> {
  const { data, error } = await supabase
    .from('decks')
    .select('id, title')
    .eq('subject_id', subjectId)
    .order('title');

  if (error) {
    console.error('Erro ao buscar decks:', error.message);
    return [];
  }
  return data ?? [];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const iconMap: Record<string, string> = {
  zap:        '⚡',
  book:       '📚',
  flask:      '🧪',
  globe:      '🌍',
  calculator: '🧮',
  pen:        '✏️',
};

type Props = { params: Promise<{ subjectId: string }> };

export default async function SubjectPage({ params }: Props) {
  const { subjectId } = await params;

  const [subject, decks] = await Promise.all([
    getSubject(subjectId),
    getDecks(subjectId),
  ]);

  if (!subject) notFound();

  const color = subject.color ?? '#7C3AED';
  const icon  = iconMap[subject.icon_url ?? ''] ?? '📖';

  return (
    <main className="min-h-screen px-4 py-12 sm:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-10"
        >
          ← Dashboard
        </Link>

        {/* Subject header */}
        <div className="flex items-center gap-5 mb-12">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{
              background: `${color}22`,
              border: `1px solid ${color}55`,
              boxShadow: `0 0 24px ${color}33`,
            }}
          >
            {icon}
          </div>
          <div>
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-1"
              style={{ color }}
            >
              Matéria
            </p>
            <h1 className="text-3xl font-bold text-white">{subject.title}</h1>
            <p className="text-slate-400 mt-1 text-sm">
              {decks.length === 0
                ? 'Nenhum deck disponível ainda.'
                : `${decks.length} deck${decks.length !== 1 ? 's' : ''} disponível${decks.length !== 1 ? 'is' : ''}`}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full mb-10"
          style={{ background: `linear-gradient(90deg, ${color}44, transparent)` }}
        />

        {/* Deck grid */}
        {decks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="text-5xl">🃏</span>
            <p className="text-slate-500 text-lg">Nenhum deck por aqui ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <DeckCard
                key={deck.id}
                id={deck.id}
                title={deck.title}
                color={color}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
