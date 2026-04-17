import { supabase }          from '@/lib/supabaseClient';
import { getSubjectIcon }    from '@/lib/iconMap';
import StudentDashboard      from '@/components/StudentDashboard';
import PerformanceMetrics    from './PerformanceMetrics';
import ChartsRow             from './ChartsRow';
import SubjectsWithDomain    from './SubjectsWithDomain';

type Subject = {
  id:       string;
  title:    string;
  icon_url: string | null;
  color:    string | null;
  category: string | null;
};

async function getSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, title, icon_url, color, category')
    .order('title');

  if (error) { console.error('Erro ao buscar matérias:', error.message); return []; }
  return data ?? [];
}

export default async function DashboardPage() {
  const subjects = await getSubjects();

  const mapped = subjects.map(s => ({
    id:       s.id,
    title:    s.title,
    icon:     getSubjectIcon(s.title, s.icon_url, s.category),
    color:    s.color ?? '#7C3AED',
    category: s.category ?? null,
  }));

  const allSubjects = [
    ...mapped,
    { id: 'redacao-flash', title: 'Redação Flash+', icon: '✒️', color: '#06b6d4', category: 'Redação' },
  ];

  return (
    <main className="min-h-screen px-4 py-12 sm:px-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">

        {/* Header + Mentor Card (Zen Focus) */}
        <StudentDashboard>

          {/* Charts: Radar ENEM + Retenção */}
          <ChartsRow subjects={mapped.map(s => ({ id: s.id, category: s.category }))} />

          {/* Métricas de Performance */}
          <PerformanceMetrics />

          {/* Matérias agrupadas por categoria */}
          <SubjectsWithDomain subjects={allSubjects} />

        </StudentDashboard>

      </div>
    </main>
  );
}
