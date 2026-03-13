import { supabase } from '@/lib/supabaseClient';
import SubjectCard from './SubjectCard';
import PerformanceMetrics from './PerformanceMetrics';
import LogoutButton from './LogoutButton';

type Subject = {
  id: string;
  title: string;
  icon_url: string | null;
  color: string | null;
};

const iconMap: Record<string, string> = {
  zap: '⚡',
  book: '📚',
  flask: '🧪',
  globe: '🌍',
  calculator: '🧮',
  pen: '✏️',
};

async function getSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, title, icon_url, color')
    .order('title');

  if (error) {
    console.error('Erro ao buscar matérias:', error.message);
    return [];
  }

  return data ?? [];
}

export default async function DashboardPage() {
  const subjects = await getSubjects();

  return (
    <main className="min-h-screen px-4 py-12 sm:px-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-12">
        <div className="flex items-center justify-between mb-2">
          <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase">
            FlashAprova
          </p>
          <LogoutButton />
        </div>
        <h1 className="text-4xl font-bold text-white leading-tight">
          E aí! Bora moer esses cards? 🚀
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Escolha uma matéria e comece a revisar agora.
        </p>
      </div>

      {/* Métricas de Performance */}
      <PerformanceMetrics />

      {/* Grid de matérias */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.length === 0 ? (
          <p className="text-slate-500 col-span-3 text-center py-20">
            Nenhuma matéria encontrada.
          </p>
        ) : (
          subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              id={subject.id}
              title={subject.title}
              icon={iconMap[subject.icon_url ?? ''] ?? '📖'}
              color={subject.color ?? '#7C3AED'}
            />
          ))
        )}
      </div>
    </main>
  );
}
