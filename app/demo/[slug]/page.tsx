import { createClient } from '@/lib/supabase/server';
import DirectorDashboard, {
  type DirectorDashboardData,
} from '@/components/DirectorDashboard';

// Mock data realista — dados ilustrativos que parecem reais para a demo de vendas
const DEMO_MOCK_DATA: Omit<DirectorDashboardData, 'school'> = {
  engagement_pct:   87,
  memory_score:     74,
  students_at_risk: 12,
  top_subject:      'Biologia (Citologia)',
  critical_subject: 'História (Brasil Colônia)',
  radar: [
    { area: 'Natureza',   value: 79 },
    { area: 'Humanas',    value: 61 },
    { area: 'Linguagens', value: 83 },
    { area: 'Matemática', value: 66 },
  ],
  critical_subjects: [
    { name: 'Estequiometria',      retention: 22 },
    { name: 'Brasil Colônia',      retention: 31 },
    { name: 'Funções do 2º Grau',  retention: 38 },
    { name: 'Geopolítica Mundial', retention: 44 },
    { name: 'Genética Mendeliana', retention: 49 },
  ],
  classes: [
    {
      id: '1',
      name: '3º Ano A',
      student_count: 45,
      retention_avg: 82,
      radar: [
        { area: 'Natureza',   value: 85 },
        { area: 'Humanas',    value: 70 },
        { area: 'Linguagens', value: 88 },
        { area: 'Matemática', value: 75 },
      ],
      students: [
        {
          id: 's1', name: 'Ana Beatriz Costa',
          retention: 91, engagement: 95,
          study_hours: [14, 15, 16, 19, 20, 21, 14, 15],
          forgetting_curve: [
            { day: 'Seg', retention: 98 }, { day: 'Ter', retention: 88 },
            { day: 'Qua', retention: 79 }, { day: 'Qui', retention: 85 },
            { day: 'Sex', retention: 90 }, { day: 'Sáb', retention: 93 },
            { day: 'Dom', retention: 91 },
          ],
        },
        {
          id: 's2', name: 'Carlos Eduardo Lima',
          retention: 73, engagement: 68,
          study_hours: [22, 23, 0, 1, 2, 23, 0, 22, 1],
          forgetting_curve: [
            { day: 'Seg', retention: 80 }, { day: 'Ter', retention: 70 },
            { day: 'Qua', retention: 55 }, { day: 'Qui', retention: 60 },
            { day: 'Sex', retention: 52 }, { day: 'Sáb', retention: 65 },
            { day: 'Dom', retention: 73 },
          ],
        },
        {
          id: 's3', name: 'Fernanda Oliveira',
          retention: 38, engagement: 42,
          study_hours: [23, 0, 1, 2, 3, 23, 0, 1, 2],
          forgetting_curve: [
            { day: 'Seg', retention: 65 }, { day: 'Ter', retention: 55 },
            { day: 'Qua', retention: 40 }, { day: 'Qui', retention: 30 },
            { day: 'Sex', retention: 25 }, { day: 'Sáb', retention: 32 },
            { day: 'Dom', retention: 38 },
          ],
        },
        {
          id: 's4', name: 'Rafael Santos Melo',
          retention: 85, engagement: 88,
          study_hours: [8, 9, 14, 15, 16, 20, 8, 14],
          forgetting_curve: [
            { day: 'Seg', retention: 90 }, { day: 'Ter', retention: 85 },
            { day: 'Qua', retention: 82 }, { day: 'Qui', retention: 88 },
            { day: 'Sex', retention: 86 }, { day: 'Sáb', retention: 87 },
            { day: 'Dom', retention: 85 },
          ],
        },
      ],
    },
    {
      id: '2',
      name: '3º Ano B',
      student_count: 42,
      retention_avg: 68,
      radar: [
        { area: 'Natureza',   value: 72 },
        { area: 'Humanas',    value: 55 },
        { area: 'Linguagens', value: 78 },
        { area: 'Matemática', value: 58 },
      ],
      students: [
        {
          id: 's5', name: 'Mariana Ferreira',
          retention: 62, engagement: 71,
          study_hours: [18, 19, 20, 18, 19, 20, 18],
          forgetting_curve: [
            { day: 'Seg', retention: 75 }, { day: 'Ter', retention: 68 },
            { day: 'Qua', retention: 60 }, { day: 'Qui', retention: 65 },
            { day: 'Sex', retention: 63 }, { day: 'Sáb', retention: 62 },
            { day: 'Dom', retention: 62 },
          ],
        },
        {
          id: 's6', name: 'Lucas Mendes',
          retention: 29, engagement: 33,
          study_hours: [23, 0, 23, 0, 1, 23],
          forgetting_curve: [
            { day: 'Seg', retention: 50 }, { day: 'Ter', retention: 40 },
            { day: 'Qua', retention: 30 }, { day: 'Qui', retention: 25 },
            { day: 'Sex', retention: 20 }, { day: 'Sáb', retention: 28 },
            { day: 'Dom', retention: 29 },
          ],
        },
      ],
    },
  ],
};

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('demo_schools')
    .select('name')
    .eq('slug', slug)
    .maybeSingle();

  return {
    title: data?.name ? `Painel ${data.name} — FlashAprova` : 'Demo — FlashAprova',
  };
}

function NotAvailable() {
  return (
    <div className="min-h-screen bg-[var(--fa-bg)] flex items-center justify-center text-[var(--fa-text)]">
      <div className="text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h1 className="text-xl font-semibold mb-2">Demo não disponível</h1>
        <p className="text-[var(--fa-text-2)] text-sm">O link pode ter expirado ou estar incorreto.</p>
      </div>
    </div>
  );
}

export default async function DemoPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { token } = await searchParams;

  if (!token) return <NotAvailable />;

  const supabase = await createClient();
  const { data: school } = await supabase
    .from('demo_schools')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!school || school.token !== token) return <NotAvailable />;

  const data: DirectorDashboardData = {
    ...DEMO_MOCK_DATA,
    school: {
      name:          school.name,
      logo_url:      school.logo_url ?? undefined,
      primary_color: school.primary_color,
    },
  };

  const alunoLink = `/demo/${slug}/aluno?token=${token}`;

  return (
    <div>
      {/* Banner de navegação entre os dois painéis */}
      <div
        className="flex items-center justify-center gap-3 py-3 px-4"
        style={{ background: `${school.primary_color}12`, borderBottom: `1px solid ${school.primary_color}30` }}
      >
        <span className="text-xs font-semibold" style={{ color: `${school.primary_color}CC` }}>
          Você está vendo o painel do diretor
        </span>
        <span style={{ color: `${school.primary_color}40` }}>·</span>
        <a
          href={alunoLink}
          className="text-xs font-bold underline underline-offset-2"
          style={{ color: school.primary_color }}
        >
          Ver como o aluno vê →
        </a>
      </div>
      <DirectorDashboard data={data} />
    </div>
  );
}
