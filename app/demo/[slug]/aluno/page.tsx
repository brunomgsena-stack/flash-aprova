import { createClient } from '@/lib/supabase/server';
import DemoStudentDashboard from '@/components/DemoStudentDashboard';

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
    title: data?.name ? `Dashboard do Aluno — ${data.name}` : 'Demo Aluno — FlashAprova',
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

export default async function DemoAlunoPage({ params, searchParams }: Props) {
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

  const directorLink = `/demo/${slug}?token=${token}`;

  return (
    <div>
      {/* Banner de navegação entre os dois painéis */}
      <div
        className="flex items-center justify-center gap-3 py-3 px-4"
        style={{ background: `${school.primary_color}12`, borderBottom: `1px solid ${school.primary_color}30` }}
      >
        <span className="text-xs font-semibold" style={{ color: `${school.primary_color}CC` }}>
          Você está vendo o painel do aluno
        </span>
        <span style={{ color: `${school.primary_color}40` }}>·</span>
        <a
          href={directorLink}
          className="text-xs font-bold underline underline-offset-2"
          style={{ color: school.primary_color }}
        >
          ← Ver painel do diretor
        </a>
      </div>
      <DemoStudentDashboard
        schoolName={school.name}
        schoolLogo={school.logo_url ?? undefined}
        primaryColor={school.primary_color}
        tutorName={school.tutor_name ?? 'Tutor IA'}
      />
    </div>
  );
}
